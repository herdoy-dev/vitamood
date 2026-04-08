import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

export default function HomeTab() {
  const router = useRouter();

  return (
    <Screen scroll>
      <View className="flex-row items-start justify-between">
        <View className="gap-1">
          <Text variant="caption">Today</Text>
          <Text variant="title">How are you doing?</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Account"
          onPress={() => router.push("/account")}
          hitSlop={12}
          className="p-2"
        >
          <Feather name="user" size={22} color="rgb(108 112 122)" />
        </Pressable>
      </View>

      <Card className="mt-6">
        <Text variant="subtitle">Daily check-in</Text>
        <Text variant="caption" className="mt-1">
          You haven't checked in yet today. It takes about 30 seconds.
        </Text>
      </Card>
    </Screen>
  );
}
