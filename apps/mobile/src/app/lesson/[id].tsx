import React, { useEffect, useState } from "react";
import { Linking, Pressable, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { LessonContent, QuizMetadata } from "@omnilient/contracts";
import { useApp } from "../../lib/state";
import { api, content } from "../../lib/client";
import { Shell } from "../../components/Shell";
import { LessonImage } from "../../components/LessonImage";
import {
  Button,
  colors,
  ErrorBox,
  Label,
  Loading,
  styles,
} from "../../components/ui";
export default function LessonRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language } = useApp();
  return <Lesson key={`${id}:${language}`} id={id} />;
}
function Lesson({ id }: { id: string }) {
  const {
      tr,
      catalog,
      language,
      session,
      progress,
      saveProgress,
      error: catalogError,
      retry,
    } = useApp(),
    { width } = useWindowDimensions();
  const [document, setDocument] = useState<LessonContent | null>(null),
    [quizzes, setQuizzes] = useState<QuizMetadata[]>([]),
    [error, setError] = useState(""),
    [saveError, setSaveError] = useState(""),
    [busy, setBusy] = useState(false),
    [attempt, setAttempt] = useState(0);
  const metadata = catalog?.disciplines
    .flatMap((d) => d.topics.flatMap((t) => t.lessons))
    .find((l) => l.id === id);
  useEffect(() => {
    if (!catalog || !metadata) return;
    let active = true;
    content("lessons", catalog.cdnBaseUrl, id, language, metadata.version)
      .then((v) => {
        if (active) {
          setDocument(v);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    api<QuizMetadata[]>(`/lessons/${id}/quizzes?language=${language}`)
      .then((v) => {
        if (active) {
          setQuizzes(v);
          for (const q of v)
            content(
              "quizzes",
              catalog.cdnBaseUrl,
              q.id,
              language,
              q.version,
            ).catch(() => {});
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [catalog, metadata, id, language, attempt]);
  const completed = progress.some((p) => p.lessonId === id && p.completed);
  const save = async () => {
    if (!session) {
      router.push({
        pathname: "/sign-in",
        params: { returnTo: `/lesson/${id}` },
      });
      return;
    }
    setBusy(true);
    setSaveError("");
    try {
      await saveProgress(id, !completed);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push("/")}
        style={{ alignSelf: "flex-start", marginBottom: 25 }}
      >
        <Label style={{ fontSize: 13, color: colors.muted }}>
          ← {tr("Back to the library", "Retour à la bibliothèque")}
        </Label>
      </Pressable>
      {catalogError ? (
        <ErrorBox message={catalogError} retry={retry} />
      ) : !catalog ? (
        <Loading />
      ) : !metadata ? (
        <ErrorBox
          message={tr(
            "This lesson is not available in this language.",
            "Cette leçon n’est pas disponible dans cette langue.",
          )}
        />
      ) : error ? (
        <ErrorBox message={error} retry={() => setAttempt((v) => v + 1)} />
      ) : !document ? (
        <Loading />
      ) : (
        <View style={{ maxWidth: 780, alignSelf: "center", width: "100%" }}>
          <Label style={styles.eyebrow}>
            {catalog.disciplines
              .find((d) =>
                d.topics.some((t) => t.lessons.some((l) => l.id === id)),
              )
              ?.name.toLocaleUpperCase(language)}
          </Label>
          <Label
            display
            accessibilityRole="header"
            style={[
              styles.title,
              {
                marginTop: 17,
                fontSize: width < 700 ? 32 : 43,
                lineHeight: width < 700 ? 43 : 56,
              },
            ]}
          >
            {document.title}
          </Label>
          <Label style={[styles.subtitle, { marginTop: 15 }]}>
            {document.summary}
          </Label>
          <View
            style={{
              flexDirection: "row",
              gap: 18,
              marginTop: 24,
              paddingBottom: 25,
              borderBottomWidth: 1,
              borderColor: colors.line,
            }}
          >
            <Label style={{ fontSize: 12, color: colors.muted }}>
              {document.minutes} {tr("min read", "min de lecture")}
            </Label>
            <Label style={{ fontSize: 12, color: colors.muted }}>
              {tr("Foundations", "Fondamentaux")}
            </Label>
            {completed && (
              <Label style={{ fontSize: 12, color: colors.green }}>
                ✓ {tr("Completed", "Terminée")}
              </Label>
            )}
          </View>
          <View style={{ marginTop: 15 }}>
            {document.blocks.map((block, index) =>
              block.type === "heading" ? (
                <Label
                  key={index}
                  display
                  accessibilityRole="header"
                  style={{
                    fontSize: 25,
                    lineHeight: 35,
                    marginTop: 32,
                    marginBottom: 16,
                  }}
                >
                  {block.text}
                </Label>
              ) : block.type === "paragraph" ? (
                <Label
                  key={index}
                  style={{
                    fontSize: 17,
                    lineHeight: 31,
                    color: "#414C43",
                    marginBottom: 20,
                  }}
                >
                  {block.text}
                </Label>
              ) : block.type === "callout" ? (
                <View
                  key={index}
                  style={{
                    padding: 24,
                    backgroundColor: "#E8EDDC",
                    borderRadius: 12,
                    marginVertical: 15,
                  }}
                >
                  <Label style={{ fontFamily: "Medium" }}>{block.title}</Label>
                  <Label style={{ marginTop: 8, lineHeight: 27 }}>
                    {block.text}
                  </Label>
                </View>
              ) : (
                <LessonImage
                  key={index}
                  base={catalog.cdnBaseUrl}
                  imageId={block.imageId}
                  alt={block.alt}
                  caption={block.caption}
                />
              ),
            )}
          </View>
          <View
            style={{
              borderTopWidth: 1,
              borderColor: colors.line,
              paddingTop: 22,
              marginTop: 15,
              gap: 10,
            }}
          >
            <Label style={styles.eyebrow}>
              {tr(
                "SOURCES & FURTHER READING",
                "SOURCES ET LECTURES COMPLÉMENTAIRES",
              )}
            </Label>
            {document.sources.map((source) => (
              <Pressable
                key={source.url}
                accessibilityRole="link"
                onPress={() =>
                  Linking.openURL(source.url).catch((e) =>
                    setSaveError(e.message),
                  )
                }
              >
                <Label
                  style={{ fontSize: 13, textDecorationLine: "underline" }}
                >
                  {source.title} ↗
                </Label>
              </Pressable>
            ))}
          </View>
          <View
            style={{
              backgroundColor: "#E5EBD8",
              padding: 28,
              borderRadius: 15,
              marginTop: 35,
              gap: 15,
            }}
          >
            <Label display style={{ fontSize: 26, lineHeight: 35 }}>
              {tr(
                "Make your new knowledge stick.",
                "Ancrez vos nouvelles connaissances.",
              )}
            </Label>
            <Label style={{ color: colors.muted }}>
              {tr(
                "Reflect on what you learned, then put it into practice.",
                "Faites le point sur votre lecture, puis passez à la pratique.",
              )}
            </Label>
            <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
              <Button secondary disabled={busy} onPress={save}>
                {busy
                  ? tr("Saving…", "Enregistrement…")
                  : completed
                    ? tr("✓ Completed · Undo", "✓ Terminée · Annuler")
                    : tr("Mark as complete", "Marquer comme terminée")}
              </Button>
              {quizzes.map((q) => (
                <Button key={q.id} onPress={() => router.push(`/quiz/${q.id}`)}>
                  {tr("Take the quiz", "Faire le quiz")} →
                </Button>
              ))}
            </View>
            {!quizzes.length && (
              <Label style={{ fontSize: 12, color: colors.muted }}>
                {tr(
                  "Quiz unavailable while offline.",
                  "Quiz indisponible hors ligne.",
                )}
              </Label>
            )}
            {!!saveError && <ErrorBox message={saveError} />}
          </View>
        </View>
      )}
    </Shell>
  );
}
