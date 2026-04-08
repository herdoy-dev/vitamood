import { View } from "react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

export default function ChatTab() {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-2">
        <Text variant="title">Chat</Text>
        <Text variant="muted" className="text-center">
          Your AI companion will live here.
        </Text>
      </View>
    </Screen>
  );
}
