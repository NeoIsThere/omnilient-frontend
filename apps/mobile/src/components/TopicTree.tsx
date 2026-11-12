import { Pressable, View, useWindowDimensions } from "react-native";
import { Link } from "expo-router";
import type { Topic } from "@omnilient/contracts";
import { useApp } from "../lib/state";
import { content } from "../lib/client";
import { colors, Label } from "./ui";
export function TopicTree({ topics, query = "" }: { topics: Topic[]; query?: string }) {
  const { tr, language, catalog, progress } = useApp();
  const compact = useWindowDimensions().width < 700;
  const term = query.trim().toLocaleLowerCase(language);
  const matches = (text: string) => text.toLocaleLowerCase(language).includes(term);
  const byId = new Map(topics.map(topic => [topic.id, topic]));
  const children = new Map<string | null, Topic[]>();
  for (const topic of topics) {
    const parent = topic.parentId && byId.has(topic.parentId) ? topic.parentId : null;
    children.set(parent, [...(children.get(parent) || []), topic]);
  }
  for (const siblings of children.values()) siblings.sort((a, b) => a.order - b.order);
  const rows: { topic: Topic; depth: number }[] = [];
  const seen = new Set<string>();
  function visit(topic: Topic, depth: number) {
    if (seen.has(topic.id)) return;
    seen.add(topic.id);
    rows.push({ topic, depth });
    for (const child of children.get(topic.id) || []) visit(child, depth + 1);
  }
  for (const root of children.get(null) || []) visit(root, 0);
  // Keep every supplied topic visible even when a parent is absent or malformed.
  for (const topic of [...topics].sort((a, b) => a.order - b.order)) visit(topic, 0);
  function ancestors(topic: Topic) {
    const chain: Topic[] = [];
    const visited = new Set<string>();
    let current: Topic | undefined = topic;
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      chain.push(current);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return chain;
  }
  const branchMatches = (topic: Topic) => !term || ancestors(topic).some(t => matches(t.name));
  const visible = new Set<string>();
  for (const { topic } of rows) {
    if (branchMatches(topic) || topic.lessons.some(l => matches(`${l.title} ${l.summary}`))) {
      for (const ancestor of ancestors(topic)) visible.add(ancestor.id);
    }
  }
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 12,
        padding: compact ? 16 : 22,
        backgroundColor: "white",
        gap: 18,
      }}
    >
      {!topics.length && <Label style={{ color: colors.muted }}>{tr("No topics yet.", "Aucun thème pour le moment.")}</Label>}
      {rows.filter(({ topic }) => visible.has(topic.id)).map(({ topic, depth }) => (
        <View
          key={topic.id}
          style={{
            marginLeft: Math.min(depth, compact ? 4 : 6) * (compact ? 12 : 20),
            borderLeftWidth: depth ? 1 : 0,
            borderLeftColor: colors.line,
            paddingLeft: depth ? 12 : 0,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: "row", gap: 9, alignItems: "flex-start" }}>
            <Label style={{ color: colors.muted }}>{depth ? "↳" : "○"}</Label>
            <Label accessibilityRole="header" style={{ fontFamily: "Medium", flex: 1 }}>
              {topic.name}
            </Label>
          </View>
          {[...topic.lessons]
            .sort((a, b) => a.order - b.order)
            .filter(lesson => branchMatches(topic) || matches(`${lesson.title} ${lesson.summary}`))
            .map(lesson => {
              const completed = progress.some(p => p.lessonId === lesson.id && p.completed);
              return (
                <Link key={lesson.id} href={`/lesson/${lesson.id}`} asChild>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`${lesson.title}, ${lesson.minutes} min${completed ? `, ${tr("Completed", "Terminée")}` : ""}`}
                    onHoverIn={() => {
                      if (catalog) content("lessons", catalog.cdnBaseUrl, lesson.id, language, lesson.version).catch(() => {});
                    }}
                    style={{
                      marginLeft: compact ? 10 : 24,
                      padding: compact ? 13 : 16,
                      borderWidth: 1,
                      borderColor: colors.line,
                      borderRadius: 10,
                      backgroundColor: "#F6F8F2",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View style={{ flex: 1, gap: 4 }}>
                      <Label style={{ fontSize: 11, color: colors.muted }}>
                        {tr("Lesson", "Leçon")} · {lesson.minutes} min
                      </Label>
                      <Label style={{ fontFamily: "Medium", fontSize: 16 }}>{lesson.title}</Label>
                      {!!lesson.summary && <Label style={{ fontSize: 12, color: colors.muted }} numberOfLines={2}>{lesson.summary}</Label>}
                    </View>
                    <Label>{completed ? "✓" : "→"}</Label>
                  </Pressable>
                </Link>
              );
            })}
        </View>
      ))}
    </View>
  );
}
