import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Shell } from "../../components/Shell";
import { TopicTree } from "../../components/TopicTree";
import { colors, ErrorBox, Label, Loading, styles } from "../../components/ui";
import { useApp } from "../../lib/state";

export default function DisciplineRoute() {
  const { id, q } = useLocalSearchParams<{ id: string; q?: string }>();
  return <Discipline key={id} id={id} initialQuery={q || ""} />;
}
function Discipline({ id, initialQuery }: { id: string; initialQuery: string }) {
  const { catalog, error, retry, tr, language, progress } = useApp();
  const [query, setQuery] = useState(initialQuery);
  if (!catalog) return <Shell>{error ? <ErrorBox message={error} retry={retry} /> : <Loading />}</Shell>;
  const discipline = catalog.disciplines.find(d => d.id === id);
  const lessons = discipline?.topics.flatMap(t => t.lessons) || [];
  const completed = lessons.filter(l => progress.some(p => p.lessonId === l.id && p.completed)).length;
  return <Shell>
    <Pressable accessibilityRole="link" onPress={() => router.push("/")} style={{ alignSelf: "flex-start", paddingVertical: 12, marginBottom: 18 }}>
      <Label style={{ color: colors.green, fontSize: 13 }}>← {tr("All disciplines", "Toutes les disciplines")}</Label>
    </Pressable>
    {!discipline ? <Label>{tr("Discipline not found.", "Discipline introuvable.")}</Label> : <>
      <Label style={styles.eyebrow}>{tr("EXPLORE THE CURRICULUM", "EXPLOREZ LE PROGRAMME")}</Label>
      <Label display accessibilityRole="header" style={[styles.title, { marginTop: 12 }]}>{discipline.name}</Label>
      <Label style={[styles.subtitle, { marginTop: 10 }]}>{discipline.description}</Label>
      <Label style={{ color: colors.muted, fontSize: 12, marginVertical: 20 }}>
        {discipline.topics.filter(t => !t.isLesson).length} {tr("topics", "thèmes")} · {discipline.topics.filter(t => t.isLesson).length} {tr("planned lessons", "leçons prévues")} · {lessons.length} {tr("available", "disponibles")}
        {completed > 0 ? ` · ${completed} ${tr("completed", "terminées")}` : ""}
      </Label>
      {!lessons.length && <Label style={{ fontSize: 13, color: colors.muted, lineHeight: 22, marginBottom: 16 }}>
        {tr("Browse the outline below. Lessons will become readable here as they are published.", "Parcourez le programme ci-dessous. Les leçons seront accessibles ici au fil de leur publication.")}
      </Label>}
      <TextInput accessibilityLabel={tr("Search topics and lessons", "Rechercher des thèmes et des leçons")}
        value={query} onChangeText={setQuery} placeholder={tr("Search this discipline…", "Rechercher dans cette discipline…")}
        placeholderTextColor={colors.muted} style={[styles.input, { fontSize: 14, marginBottom: 12 }]} />
      <View style={{ marginBottom: 24 }}>
        <TopicTree key={`${id}:${language}`} topics={discipline.topics} query={query} />
      </View>
    </>}
  </Shell>;
}
