import { useMemo, useState } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { Link } from "expo-router";
import type { Topic } from "@omnilient/contracts";
import { useApp } from "../lib/state";
import { content } from "../lib/client";
import { colors, Label } from "./ui";
import { DeleteControl } from "./DeleteControl";
import { displayLessonTitle, displayTopicName, numberTopics } from "../lib/topic-numbering";

export function TopicTree({ topics, query = "" }: { topics: Topic[]; query?: string }) {
  const { tr, language, catalog, progress } = useApp();
  const compact = useWindowDimensions().width < 700;
  const numbers = useMemo(() => numberTopics(topics), [topics]);
  const [expanded, setExpanded] = useState(() => new Set(topics.filter(t => !t.parentId).map(t => t.id)));
  const term = query.trim().toLocaleLowerCase(language);
  const { rows, branches, visible, matchingBranches } = useMemo(() => {
    const byId = new Map(topics.map(t => [t.id, t]));
    const children = new Map<string | null, Topic[]>();
    for (const topic of topics) {
      const parent = topic.parentId && byId.has(topic.parentId) ? topic.parentId : null;
      const siblings = children.get(parent) || [];
      siblings.push(topic); children.set(parent, siblings);
    }
    for (const siblings of children.values()) siblings.sort((a, b) => a.order - b.order);
    const rows: { topic: Topic; ancestors: string[] }[] = [], seen = new Set<string>();
    function visit(topic: Topic, ancestors: string[]) {
      if (seen.has(topic.id)) return;
      seen.add(topic.id); rows.push({ topic, ancestors });
      for (const child of children.get(topic.id) || []) visit(child, [...ancestors, topic.id]);
    }
    for (const root of children.get(null) || []) visit(root, []);
    for (const topic of topics) visit(topic, []);
    const branches = new Set([...children.keys()].filter((id): id is string => id !== null));
    const matchingBranches = new Set(topics.filter(t => displayTopicName(t, numbers).toLocaleLowerCase(language).includes(term)).map(t => t.id));
    const visible = new Set<string>();
    for (const { topic, ancestors } of rows) {
      if (!term || matchingBranches.has(topic.id) || ancestors.some(id => matchingBranches.has(id)) ||
        topic.lessons.some(l => `${l.title} ${l.summary}`.toLocaleLowerCase(language).includes(term))) {
        visible.add(topic.id);
        for (const id of ancestors) visible.add(id);
      }
    }
    return { rows, branches, visible, matchingBranches };
  }, [topics, term, language, numbers]);
  const shown = rows.filter(({ topic, ancestors }) => visible.has(topic.id) && (term || ancestors.every(id => expanded.has(id))));
  const toggle = (id: string) => setExpanded(old => {
    const next = new Set(old);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  return <View style={{ gap: 12 }}>
    {!term && branches.size > 0 && <View style={{ flexDirection: "row", gap: 20 }}>
      <Pressable accessibilityRole="button" onPress={() => setExpanded(new Set(branches))} style={{ paddingVertical: 10 }}>
        <Label style={{ fontSize: 12, color: colors.green }}>{tr("Expand all", "Tout développer")}</Label>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => setExpanded(new Set())} style={{ paddingVertical: 10 }}>
        <Label style={{ fontSize: 12, color: colors.green }}>{tr("Collapse all", "Tout réduire")}</Label>
      </Pressable>
    </View>}
    <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: compact ? 12 : 20, backgroundColor: "white", gap: 8 }}>
      {!shown.length && <Label style={{ color: colors.muted, padding: 12 }}>
        {topics.length ? tr("No matching topics or lessons.", "Aucun thème ni aucune leçon correspondants.") : tr("No topics yet.", "Aucun thème pour le moment.")}
      </Label>}
      {shown.map(({ topic, ancestors }) => {
        const branch = branches.has(topic.id), open = !!term || expanded.has(topic.id);
        const label = <>
          <Label style={{ color: colors.green, width: 16 }}>{branch ? open ? "−" : "+" : topic.isLesson ? "◇" : "○"}</Label>
          <View style={{ flex: 1, gap: 5 }}>
            <Label style={{ fontFamily: branch ? "Medium" : "Body", fontSize: compact ? 13 : 14, lineHeight: 22 }}>{displayTopicName(topic, numbers)}</Label>
            {topic.isLesson && <Label style={{ fontSize: 10, color: colors.muted }}>
              {tr("LESSON", "LEÇON")} · {topic.lessons.length ? tr("Available", "Disponible") : tr("Planned", "À venir")}
            </Label>}
          </View>
        </>;
        return <View key={topic.id} style={{ marginLeft: Math.min(ancestors.length, 5) * (compact ? 10 : 22), borderLeftWidth: ancestors.length ? 1 : 0, borderLeftColor: colors.line, paddingLeft: ancestors.length ? 8 : 0 }}>
          {branch ? <Pressable accessibilityRole="button" accessibilityLabel={displayTopicName(topic, numbers)} accessibilityState={{ expanded: open }}
            disabled={!!term} onPress={() => toggle(topic.id)} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 12 }}>
            {label}
          </Pressable> : <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 12 }}>{label}</View>}
          <DeleteControl kind="topics" id={topic.id} name={displayTopicName(topic, numbers)} />
          {[...topic.lessons].sort((a, b) => a.order - b.order)
            .filter(l => !term || matchingBranches.has(topic.id) || ancestors.some(id => matchingBranches.has(id)) || `${l.title} ${l.summary}`.toLocaleLowerCase(language).includes(term))
            .map(lesson => {
              const completed = progress.some(p => p.lessonId === lesson.id && p.completed);
              return <Link key={lesson.id} href={`/lesson/${lesson.id}`} asChild>
                <Pressable accessibilityRole="link" accessibilityLabel={`${displayLessonTitle(lesson.title, topic.id, numbers)}, ${completed ? tr("Completed", "Terminée") : tr("Read lesson", "Lire la leçon")}`}
                  onHoverIn={() => { if (catalog) content("lessons", catalog.cdnBaseUrl, lesson.id, language, lesson.version).catch(() => {}); }}
                  style={{ marginLeft: 24, marginBottom: 10, padding: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 10, backgroundColor: "#F0F4E9", flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ flex: 1, gap: 5 }}>
                    <Label style={{ fontFamily: "Medium", fontSize: 14 }}>{displayLessonTitle(lesson.title, topic.id, numbers)}</Label>
                    <Label style={{ fontSize: 11, color: colors.muted }}>{lesson.minutes} min · {completed ? tr("Completed", "Terminée") : tr("Read lesson", "Lire la leçon")}</Label>
                  </View>
                  <Label>{completed ? "✓" : "→"}</Label>
                </Pressable>
              </Link>;
            })}
        </View>;
      })}
    </View>
  </View>;
}
