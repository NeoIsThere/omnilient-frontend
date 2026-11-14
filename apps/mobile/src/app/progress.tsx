import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import type { Attempt } from "@omnilient/contracts";
import { useApp } from "../lib/state";
import { displayLessonTitle, numberTopics } from "../lib/topic-numbering";
import { Shell } from "../components/Shell";
import {
  Button,
  colors,
  ErrorBox,
  Label,
  Loading,
  styles,
} from "../components/ui";
export default function ProgressRoute() {
  const { session, language } = useApp();
  return <Progress key={`${session?.user.id}:${language}`} />;
}
function Progress() {
  const { tr, session, progress, request, catalog, language } = useApp();
  const [attempts, setAttempts] = useState<Attempt[] | null>(null),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    if (session)
      request<Attempt[]>("/me/attempts")
        .then((v) => {
          if (active) {
            setAttempts(v);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [request, session, reload]);
  if (!session)
    return (
      <Shell>
        <View style={{ paddingVertical: 45, gap: 20, maxWidth: 620 }}>
          <Label style={styles.eyebrow}>
            {tr("YOUR LEARNING, CONNECTED", "VOTRE APPRENTISSAGE, CONNECTÉ")}
          </Label>
          <Label display style={styles.title}>
            {tr("Every discovery adds up.", "Chaque découverte compte.")}
          </Label>
          <Label style={styles.subtitle}>
            {tr(
              "Sign in to save completed lessons and revisit your quiz results, in any language.",
              "Connectez-vous pour enregistrer vos leçons et retrouver vos résultats, dans chaque langue.",
            )}
          </Label>
          <Button
            onPress={() => router.push("/sign-in")}
            style={{ alignSelf: "flex-start" }}
          >
            {tr("Start your journey", "Commencer votre parcours")} →
          </Button>
        </View>
      </Shell>
    );
  const completed = progress.filter((p) => p.completed),
    average = attempts?.length
      ? Math.round(attempts.reduce((n, a) => n + a.score, 0) / attempts.length)
      : 0;
  const lessons = catalog?.disciplines.flatMap((d) => {
    const numbers = numberTopics(d.topics);
    return d.topics.flatMap((t) => t.lessons.map((l) => ({
      ...l,
      title: displayLessonTitle(l.title, t.id, numbers),
    })));
  }) || [];
  return (
    <Shell>
      <Label style={styles.eyebrow}>
        {tr("YOUR LEARNING JOURNEY", "VOTRE PARCOURS")}
      </Label>
      <Label
        display
        accessibilityRole="header"
        style={[styles.title, { marginTop: 12 }]}
      >
        {tr("Keep your curiosity growing.", "Cultivez votre curiosité.")}
      </Label>
      <Label style={[styles.subtitle, { marginTop: 12, marginBottom: 30 }]}>
        {tr(
          "One lesson at a time. Your progress travels with you across languages.",
          "Une leçon à la fois. Votre progression vous suit dans toutes les langues.",
        )}
      </Label>
      <View style={{ flexDirection: "row", gap: 14, flexWrap: "wrap" }}>
        {[
          [completed.length, tr("Lessons completed", "Leçons terminées")],
          [attempts?.length || 0, tr("Quiz attempts", "Quiz réalisés")],
          [`${average}%`, tr("Average quiz score", "Score moyen")],
        ].map(([value, label]) => (
          <View key={label} style={[styles.card, { flex: 1, minWidth: 180 }]}>
            <Label display style={{ fontSize: 38, lineHeight: 49 }}>
              {value}
            </Label>
            <Label style={{ fontSize: 13, color: colors.muted, marginTop: 6 }}>
              {label}
            </Label>
          </View>
        ))}
      </View>
      <Label
        display
        accessibilityRole="header"
        style={{ fontSize: 26, marginTop: 35, marginBottom: 20 }}
      >
        {tr("Completed lessons", "Leçons terminées")}
      </Label>
      {completed.length ? (
        <View style={{ gap: 10 }}>
          {completed.map((p) => (
            <Pressable
              accessibilityRole="link"
              key={p.lessonId}
              onPress={() => router.push(`/lesson/${p.lessonId}`)}
              style={[
                styles.card,
                { flexDirection: "row", gap: 15, alignItems: "center" },
              ]}
            >
              <Label style={{ color: colors.green }}>✓</Label>
              <Label display style={{ fontSize: 20, flex: 1 }}>
                {lessons.find((l) => l.id === p.lessonId)?.title || p.lessonId}
              </Label>
              <Label>→</Label>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.card}>
          <Label style={{ color: colors.muted }}>
            {tr(
              "Your first discovery is waiting. Open a lesson and mark it complete when you finish.",
              "Votre première découverte vous attend. Ouvrez une leçon puis marquez-la comme terminée.",
            )}
          </Label>
          <Button
            secondary
            onPress={() => router.push("/")}
            style={{ alignSelf: "flex-start", marginTop: 15 }}
          >
            {tr("Explore the library", "Explorer la bibliothèque")} →
          </Button>
        </View>
      )}
      <Label
        display
        accessibilityRole="header"
        style={{ fontSize: 26, marginTop: 35, marginBottom: 20 }}
      >
        {tr("Recent quiz attempts", "Derniers quiz réalisés")}
      </Label>
      {error ? (
        <ErrorBox message={error} retry={() => setReload((v) => v + 1)} />
      ) : !attempts ? (
        <Loading />
      ) : !attempts.length ? (
        <View style={styles.card}>
          <Label style={{ color: colors.muted }}>
            {tr(
              "No attempts yet. A short quiz follows each available lesson.",
              "Aucun essai pour le moment. Un petit quiz accompagne chaque leçon disponible.",
            )}
          </Label>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {attempts.map((a) => (
            <View
              key={a.id}
              style={[
                styles.card,
                { flexDirection: "row", alignItems: "center", gap: 15 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Label style={{ fontFamily: "Medium" }}>{a.quizId}</Label>
                <Label
                  style={{ fontSize: 12, color: colors.muted, marginTop: 5 }}
                >
                  {new Date(a.createdAt).toLocaleString(language)} ·{" "}
                  {a.language.toUpperCase()}
                </Label>
              </View>
              <Label display style={{ fontSize: 26 }}>
                {a.score}%
              </Label>
            </View>
          ))}
        </View>
      )}
    </Shell>
  );
}
