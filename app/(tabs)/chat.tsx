import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
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
import { chatWithAria, isRealAiEnabled } from "@/lib/chat/ai-client";
import { containsCrisisLanguage } from "@/lib/safety/keyword-scan";
import { Button } from "@/components/ui/button";

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
  /** Whether this assistant message was produced by the safety
   *  pipeline in response to a flagged user message. Rendered as a
   *  distinct crisis bubble with an inline "Open help now" button. */
  flagged?: boolean;
}

/**
 * Gentle acknowledgment shown alongside the crisis bubble when a
 * user message is flagged by either the local keyword scanner or
 * the Cloud Function's Moderation backstop. Intentionally calmer
 * than the default mock crisis reply — the inline "Open help now"
 * button carries the action, so the text just needs to acknowledge.
 */
const CRISIS_ACK =
  "Thank you for telling me. What you're feeling matters, and you don't have to carry it alone. If anything feels urgent right now, please tap below — there are real, kind people on the other end of those lines.";

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
            flagged: m.flagged,
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

    // Client-side keyword scan is the FIRST pass — runs before we
    // decide whether to call the real AI or the mock. If it trips,
    // we short-circuit straight into the crisis bubble and never
    // send the message to OpenAI or the mock generator. This is
    // the fastest path to help, and it works offline. The Cloud
    // Function runs OpenAI Moderation as a further backstop.
    const localCrisis = containsCrisisLanguage(trimmed);

    // Decide whether to call the real Cloud Function or the mock.
    // The flag is off by default — flipping it on requires a deployed
    // function + OpenAI billing + ZDR (PLAN.md §9). See ai-client.ts.
    // On any failure we fall back to the mock so dev UX stays OK.
    const realAi = isRealAiEnabled();

    setTimeout(async () => {
      let replyText: string;
      let flagged = false;

      if (localCrisis) {
        // Crisis bubble short-circuit — never call the model, don't
        // leak the message to OpenAI even if the real-AI flag is on.
        replyText = CRISIS_ACK;
        flagged = true;
      } else if (realAi && user) {
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
          // Server-side OpenAI Moderation backstop (PLAN.md §4.6):
          // when the function returns flagged=true, render the
          // crisis bubble instead of the default assistant style.
          flagged = response.flagged === true;
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
          flagged,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: persistedReply.id,
            role: "assistant",
            content: persistedReply.content,
            createdAt: persistedReply.createdAt,
            flagged: persistedReply.flagged,
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
            flagged: flagged || undefined,
          },
        ]);
      }

      setThinking(false);
    }, 900);
  }

  // Track the keyboard height directly via the Keyboard API.
  // More reliable than KeyboardAvoidingView which does nothing on
  // Android with behavior=undefined and is flaky with edge-to-edge
  // + tab bars. We apply the height as paddingBottom on the input
  // container so the input row always sits above the keyboard.
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKbHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKbHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <Screen>
      <View className="flex-1" style={{ paddingBottom: kbHeight }}>
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
                {messages.map((m) =>
                  m.flagged && m.role === "assistant" ? (
                    <CrisisBubble
                      key={m.id}
                      message={m}
                      onOpenHelp={() => router.push("/crisis")}
                    />
                  ) : (
                    <MessageBubble key={m.id} message={m} />
                  ),
                )}
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

/**
 * Crisis bubble rendered when an assistant message has `flagged`
 * set. Visually distinct from regular assistant bubbles:
 *   - Full-width (not capped at 80%) so it reads as a system
 *     acknowledgment rather than part of the conversation.
 *   - Warm terracotta background tint (`bg-crisis/10`) with a
 *     matching border — never red, per PLAN.md §8.
 *   - Inline "Open help now" button that navigates to /crisis.
 *   - Small label up top so the user understands why this looks
 *     different.
 *
 * The always-visible floating HelpButton remains the PRIMARY
 * safety net (PLAN.md §4.6). This bubble is a redundant, in-line
 * reinforcement of the same path so a user in distress doesn't
 * have to notice or hunt for the floating button.
 */
function CrisisBubble({
  message,
  onOpenHelp,
}: {
  message: Message;
  onOpenHelp: () => void;
}) {
  return (
    <View className="mb-4 self-stretch rounded-2xl border border-crisis/30 bg-crisis/10 p-4">
      <Text variant="caption" className="text-crisis">
        A moment — this matters
      </Text>
      <Text variant="body" className="mt-2 text-text">
        {message.content}
      </Text>
      <View className="mt-4">
        <Button label="Open help now" variant="crisis" onPress={onOpenHelp} />
      </View>
    </View>
  );
}
