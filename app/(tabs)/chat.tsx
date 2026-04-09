import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import { getChatContext, type ChatContext } from "@/lib/chat/context";
import {
  appendMessage,
  getOrCreateActiveConversation,
  loadMessages,
} from "@/lib/chat/conversations";
import { generateMockReply } from "@/lib/chat/mock-reply";
import { chatWithAria, useRealAi } from "@/lib/chat/ai-client";

/**
 * Chat tab — AI companion (PLAN.md §4.3).
 *
 * K1 ships the UI shell with a local mock-response generator so the
 * conversation flow can be felt out without any backend wiring. The
 * mock is intentionally a small canned set, NOT an attempt to be
 * helpful — sending it to a real user would be misleading. It's
 * just enough to validate the bubble layout, auto-scroll, keyboard
 * avoidance, and input affordances.
 *
 * Real integration plan (K2+):
 *   K2: persist conversation to users/{uid}/conversations/{id}/messages
 *       so messages survive backgrounding
 *   K3: Cloud Function scaffolding (Firebase init in /functions)
 *   K4: wire the Cloud Function to OpenAI with the locked v1 prompt
 *   K5: crisis detection middleware in front of every send
 *   K6: per-user token metering + ZDR reminder
 *
 * Until K4 lands, the placeholder bubble at the top makes it
 * obvious the AI is not real yet — we don't want the user to think
 * they're getting genuine support from a canned response.
 */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export default function ChatTab() {
  const router = useRouter();
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  // Pulled once on mount — name, today's check-in, today's exercises,
  // birth year. The mock reply generator uses this to be specific
  // instead of generic. Stays null until the first fetch resolves;
  // we can still send messages while it's null, the replies will
  // just be the contextless variants.
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  // Active conversation id, resolved on mount via
  // getOrCreateActiveConversation. While null, send is disabled —
  // we don't want messages floating in local state with no
  // persistence target.
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Resolve the active conversation, then rehydrate its message
  // history. This is the call that makes the chat survive an app
  // kill — without it the local state would start empty every time.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const convId = await getOrCreateActiveConversation(user.uid);
        if (cancelled) return;
        setConversationId(convId);

        const history = await loadMessages(user.uid, convId);
        if (cancelled) return;
        setMessages(
          history.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          })),
        );
      } catch (err) {
        console.warn("Failed to load conversation:", err);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getChatContext(user.uid)
      .then((c) => {
        if (!cancelled) setChatContext(c);
      })
      .catch((err) => {
        // Don't block chat — we can still send messages with no
        // context, the replies will just be more generic.
        console.warn("Failed to load chat context:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Auto-scroll to the latest message whenever the list grows.
  useEffect(() => {
    if (messages.length === 0) return;
    // setTimeout 0 lets layout settle before we measure.
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 0);
  }, [messages.length, thinking]);

  async function onSend() {
    const trimmed = draft.trim();
    if (!trimmed || thinking || !user || !conversationId) return;

    // Snapshot whether this is the first user message *before* we
    // append it — the reply generator wants the count from before.
    const isFirstMessage =
      messages.filter((m) => m.role === "user").length === 0;

    setDraft("");
    setThinking(true);

    // Optimistic local append for the user's message — write to
    // Firestore in the background. If the write fails the message
    // still shows in local state; on reload it'd be missing, which
    // is the right semantics for "did not actually send" (vs
    // pretending it succeeded).
    try {
      const persistedUser = await appendMessage(user.uid, conversationId, {
        role: "user",
        content: trimmed,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: persistedUser.id,
          role: "user",
          content: persistedUser.content,
          createdAt: persistedUser.createdAt,
        },
      ]);
    } catch (err) {
      console.warn("Failed to persist user message:", err);
      // Surface a quiet local-only message so the user sees their
      // input echoed even if the write failed.
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          role: "user",
          content: trimmed,
          createdAt: new Date(),
        },
      ]);
    }

    // Decide whether to call the real Cloud Function or the mock.
    // The flag is off by default — flipping it on requires a deployed
    // function + OpenAI billing + ZDR (PLAN.md §9). See ai-client.ts.
    // On any failure we fall back to the mock so dev UX stays OK.
    const realAi = useRealAi();

    setTimeout(async () => {
      let replyText: string;

      if (realAi && user) {
        try {
          const recentHistory = messages
            .slice(-20)
            .map((m) => ({ role: m.role, content: m.content }));
          const response = await chatWithAria({
            message: trimmed,
            history: recentHistory,
            profile: {
              name: chatContext?.profile?.name,
              goals: chatContext?.profile?.goals,
              recentMood: chatContext?.todayCheckIn?.mood,
              recentEnergy: chatContext?.todayCheckIn?.energy,
            },
          });
          replyText = response.reply;
          // `flagged=true` means the moderation backstop intercepted
          // the message. Future work: surface the crisis card inline
          // here. For now we just render the reply and trust the
          // always-visible HelpButton — which is the primary safety
          // net per PLAN.md §4.6.
        } catch (err) {
          console.warn(
            "Real chat call failed, falling back to mock:",
            err,
          );
          replyText = chatContext
            ? generateMockReply({
                userMessage: trimmed,
                context: chatContext,
                isFirstMessage,
              })
            : "I'm here. Tell me a little more about what's going on.";
        }
      } else {
        replyText = chatContext
          ? generateMockReply({
              userMessage: trimmed,
              context: chatContext,
              isFirstMessage,
            })
          : "I'm here. Tell me a little more about what's going on.";
      }

      try {
        const persistedReply = await appendMessage(user.uid, conversationId, {
          role: "assistant",
          content: replyText,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: persistedReply.id,
            role: "assistant",
            content: persistedReply.content,
            createdAt: persistedReply.createdAt,
          },
        ]);
      } catch (err) {
        console.warn("Failed to persist assistant message:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}`,
            role: "assistant",
            content: replyText,
            createdAt: new Date(),
          },
        ]);
      }

      setThinking(false);
    }, 900);
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      <Screen>
        <View className="flex-1">
          {/* Thin chat header — caption + close button. The body
              title from the previous version is gone; this surface
              is now an immersive conversation, not a tab page. */}
          <View className="flex-row items-center justify-between border-b border-border pt-2 pb-3">
            <Text variant="caption">Companion</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={() => router.replace("/(tabs)/home")}
              hitSlop={12}
              className="p-1"
            >
              <Feather name="x" size={22} color="rgb(42 45 51)" />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            className="flex-1 mt-4"
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <PlaceholderNotice />
            {loadingHistory ? (
              <Text variant="caption" className="text-text-muted">
                Loading conversation…
              </Text>
            ) : (
              <>
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
                {thinking && <TypingBubble />}
              </>
            )}
          </ScrollView>

          <View className="flex-row items-end gap-2 pt-2">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="What's on your mind?"
              placeholderTextColor="rgb(156 160 168)"
              multiline
              maxLength={1000}
              editable={!loadingHistory}
              className="flex-1 rounded-2xl border border-border bg-surface px-4 py-3 font-body text-base text-text max-h-32"
              textAlignVertical="top"
            />
            <Pressable
              onPress={onSend}
              disabled={!draft.trim() || thinking || !conversationId}
              accessibilityRole="button"
              accessibilityLabel="Send"
              className={`h-12 w-12 items-center justify-center rounded-full ${
                draft.trim() && !thinking && conversationId
                  ? "bg-primary"
                  : "bg-border"
              }`}
            >
              <Feather
                name="arrow-up"
                size={22}
                color={
                  draft.trim() && !thinking && conversationId
                    ? "rgb(255 255 255)"
                    : "rgb(156 160 168)"
                }
              />
            </Pressable>
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function PlaceholderNotice() {
  return (
    <View className="mb-4 rounded-2xl border border-border bg-surface p-4">
      <Text variant="caption" className="text-text-muted">
        Your AI companion isn't fully connected yet. The replies you
        see here are placeholder text — try the conversation flow,
        but don't take the responses to heart.
      </Text>
    </View>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <View
      className={`mb-3 max-w-[80%] ${isUser ? "self-end" : "self-start"}`}
    >
      <View
        className={`rounded-2xl px-4 py-3 ${
          isUser ? "bg-primary" : "bg-surface border border-border"
        }`}
      >
        <Text
          variant="body"
          className={isUser ? "text-primary-fg" : "text-text"}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

function TypingBubble() {
  return (
    <View className="mb-3 max-w-[80%] self-start">
      <View className="rounded-2xl border border-border bg-surface px-4 py-3">
        <Text variant="caption" className="text-text-muted">
          …
        </Text>
      </View>
    </View>
  );
}
