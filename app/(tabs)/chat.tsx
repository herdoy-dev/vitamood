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
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

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
  createdAt: number;
}

const MOCK_REPLIES = [
  "I hear you. That sounds like a lot to carry today.",
  "Thank you for sharing that with me. Take a breath if you need one.",
  "It makes sense that you'd feel that way. What part feels heaviest right now?",
  "You're allowed to feel this. There's no rush to fix anything.",
  "I notice you said that. Can you tell me a little more?",
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatTab() {
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);

  // Auto-scroll to the latest message whenever the list grows.
  useEffect(() => {
    if (messages.length === 0) return;
    // setTimeout 0 lets layout settle before we measure.
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 0);
  }, [messages.length, thinking]);

  function onSend() {
    const trimmed = draft.trim();
    if (!trimmed || thinking) return;

    const userMessage: Message = {
      id: makeId(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setThinking(true);

    // Mock "AI" reply on a short delay so the typing indicator
    // gets a moment to land.
    setTimeout(() => {
      const reply: Message = {
        id: makeId(),
        role: "assistant",
        content: MOCK_REPLIES[messages.length % MOCK_REPLIES.length],
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
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
          <View className="gap-1">
            <Text variant="caption">Companion</Text>
            <Text variant="title">A safe place to think out loud</Text>
          </View>

          <ScrollView
            ref={scrollRef}
            className="flex-1 mt-6"
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <PlaceholderNotice />
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {thinking && <TypingBubble />}
          </ScrollView>

          <View className="flex-row items-end gap-2 pt-2">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="What's on your mind?"
              placeholderTextColor="rgb(156 160 168)"
              multiline
              maxLength={1000}
              className="flex-1 rounded-2xl border border-border bg-surface px-4 py-3 font-body text-base text-text max-h-32"
              textAlignVertical="top"
            />
            <Pressable
              onPress={onSend}
              disabled={!draft.trim() || thinking}
              accessibilityRole="button"
              accessibilityLabel="Send"
              className={`h-12 w-12 items-center justify-center rounded-full ${
                draft.trim() && !thinking ? "bg-primary" : "bg-border"
              }`}
            >
              <Feather
                name="arrow-up"
                size={22}
                color={draft.trim() && !thinking ? "rgb(255 255 255)" : "rgb(156 160 168)"}
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
