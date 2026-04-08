import { Stack, useRouter } from "expo-router";
import { Linking, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { GROUNDING_5_4_3_2_1 } from "@/constants/resources";
import { pickHotlines } from "@/lib/safety/locale";

/**
 * Always-accessible crisis screen (PLAN.md §4.6).
 *
 * Hard rules for this file:
 *   - Renders fully offline. No network calls. No Firestore reads.
 *   - Hotlines come from the bundled constants, picked by locale.
 *   - Tapping a phone number opens the dialer immediately — no
 *     confirmation step. A user in crisis should not need extra taps.
 *   - The grounding exercise is shown below the hotlines so users
 *     who can't yet bring themselves to call still have something
 *     to do right now.
 */
export default function CrisisScreen() {
  const router = useRouter();
  const region = pickHotlines();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Need help right now",
          headerStyle: { backgroundColor: "transparent" },
          headerShadowVisible: false,
        }}
      />
      <Screen scroll>
        <Text variant="title">You are not alone.</Text>
        <Text variant="muted" className="mt-2">
          If you are in immediate danger, please reach out. These
          services are free and confidential.
        </Text>

        <View className="mt-6 gap-3">
          {region.hotlines.map((hotline) => (
            <Card key={hotline.name}>
              <Text variant="subtitle">{hotline.name}</Text>
              <Text variant="caption" className="mt-1">
                {hotline.description}
              </Text>
              <View className="mt-4 gap-2">
                {hotline.phone && (
                  <Button
                    label={`Call ${formatPhone(hotline.phone)}`}
                    variant="crisis"
                    onPress={() => Linking.openURL(`tel:${hotline.phone}`)}
                  />
                )}
                {hotline.text && (
                  <Button
                    label={hotline.text}
                    variant="ghost"
                    onPress={() => {
                      // Best-effort: opens the SMS composer if the
                      // text instruction starts with "Text X to NUM"
                      const match = hotline.text?.match(/(\d{3,})/);
                      if (match) Linking.openURL(`sms:${match[1]}`);
                    }}
                  />
                )}
                {hotline.url && (
                  <Button
                    label="Open website"
                    variant="ghost"
                    onPress={() => Linking.openURL(hotline.url!)}
                  />
                )}
              </View>
            </Card>
          ))}
        </View>

        <View className="mt-8">
          <Text variant="subtitle">{GROUNDING_5_4_3_2_1.title}</Text>
          <Text variant="muted" className="mt-2">
            {GROUNDING_5_4_3_2_1.description}
          </Text>
          <Card className="mt-4">
            {GROUNDING_5_4_3_2_1.steps.map((step, i) => (
              <View
                key={step}
                className={`flex-row gap-3 ${i > 0 ? "mt-3" : ""}`}
              >
                <Text variant="body-medium" className="text-primary">
                  {i + 1}.
                </Text>
                <Text variant="body" className="flex-1">
                  {step}
                </Text>
              </View>
            ))}
          </Card>
        </View>

        <View className="mt-8 mb-6">
          <Button
            label="I'm okay for now"
            variant="ghost"
            onPress={() => router.back()}
          />
        </View>
      </Screen>
    </>
  );
}

/**
 * Light formatting so 988 stays "988" but 13-digit Australian numbers
 * get hyphenated. Just a readability touch — Linking still calls the
 * raw number.
 */
function formatPhone(raw: string): string {
  if (raw.length <= 4) return raw;
  if (raw.length === 6) return `${raw.slice(0, 3)} ${raw.slice(3)}`;
  return raw.replace(/(\d{3})(\d{3})(\d+)/, "$1 $2 $3");
}
