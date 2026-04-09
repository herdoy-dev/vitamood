import { View } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import type { LegalDocument } from "@/lib/legal/copy";

/**
 * Shared renderer for the in-app privacy policy and terms of service.
 *
 * Takes a structured LegalDocument (title + lastUpdated + sections)
 * and lays it out as a stack of headed sections. No Markdown parser
 * — the copy in `lib/legal/copy.ts` is already pre-structured.
 *
 * Lives in components/legal/ so both route screens (app/legal/
 * privacy.tsx and app/legal/terms.tsx) can share the same layout
 * without each one re-implementing spacing and typography.
 */
export function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  return (
    <View className="gap-5">
      <View className="gap-1">
        <Text variant="caption">Legal</Text>
        <Text variant="title">{doc.title}</Text>
        <Text variant="caption" className="mt-1 text-text-muted">
          Last updated {doc.lastUpdated}
        </Text>
      </View>

      {doc.sections.map((section, idx) => (
        <Card key={idx}>
          {section.heading && (
            <Text variant="subtitle" className="mb-3">
              {section.heading}
            </Text>
          )}
          <View className="gap-3">
            {section.body.map((paragraph, pIdx) => (
              <Text key={pIdx} variant="body" className="text-text">
                {paragraph}
              </Text>
            ))}
          </View>
        </Card>
      ))}
    </View>
  );
}
