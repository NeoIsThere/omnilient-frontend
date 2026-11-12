import { View } from "react-native";
import type { Topic } from "@omnilient/contracts";
import { colors, Label } from "./ui";
export function TopicTree({ topics }: { topics: Topic[] }) {
  const rows: { topic: Topic; depth: number }[] = [];
  const seen = new Set<string>();
  function visit(parentId: string | null, depth: number) {
    for (const topic of topics
      .filter((t) => t.parentId === parentId)
      .sort((a, b) => a.order - b.order)) {
      if (seen.has(topic.id)) continue;
      seen.add(topic.id);
      rows.push({ topic, depth });
      visit(topic.id, depth + 1);
    }
  }
  visit(null, 0);
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 12,
        padding: 18,
        backgroundColor: "white",
        gap: 12,
      }}
    >
      {rows.map(({ topic, depth }) => (
        <View
          key={topic.id}
          style={{
            paddingLeft: Math.min(depth, 6) * 20,
            flexDirection: "row",
            gap: 10,
          }}
        >
          <Label style={{ color: colors.muted }}>{depth ? "↳" : "○"}</Label>
          <Label style={{ fontFamily: depth ? "Body" : "Medium", flex: 1 }}>
            {topic.name}
          </Label>
          <Label style={{ color: colors.muted, fontSize: 12 }}>
            {topic.lessons.length}
          </Label>
        </View>
      ))}
    </View>
  );
}
