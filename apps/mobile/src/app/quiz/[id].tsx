import React, { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type {
  GradeResult,
  QuizContent,
  QuizMetadata,
} from "@omnilient/contracts";
import { useApp } from "../../lib/state";
import { api, content } from "../../lib/client";
import { Shell } from "../../components/Shell";
import {
  Button,
  colors,
  ErrorBox,
  Label,
  Loading,
  styles,
} from "../../components/ui";
export default function QuizRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language } = useApp();
  return <Quiz key={`${id}:${language}`} id={id} />;
}
function Quiz({ id }: { id: string }) {
  const {
    tr,
    language,
    catalog,
    session,
    request,
    error: catalogError,
    retry,
  } = useApp();
  const [quiz, setQuiz] = useState<QuizContent | null>(null),
    [metadata, setMetadata] = useState<QuizMetadata | null>(null),
    [responses, setResponses] = useState<Record<string, string>>({}),
    [result, setResult] = useState<GradeResult | null>(null),
    [error, setError] = useState(""),
    [submitError, setSubmitError] = useState(""),
    [busy, setBusy] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!catalog) return;
    let active = true;
    api<QuizMetadata>(`/quizzes/${id}?language=${language}`)
      .then(async (m) => {
        const q = await content(
          "quizzes",
          catalog.cdnBaseUrl,
          id,
          language,
          m.version,
        );
        if (q.quizVersion !== m.quizVersion)
          throw new Error("Quiz version does not match its metadata.");
        if (active) {
          setMetadata(m);
          setQuiz(q);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, language, catalog, attempt]);
  const answered =
    quiz?.questions.filter((q) => responses[q.id]?.trim()).length || 0;
  const submit = async () => {
    if (!session) {
      router.push({
        pathname: "/sign-in",
        params: { returnTo: `/quiz/${id}` },
      });
      return;
    }
    if (!quiz || busy) return;
    setBusy(true);
    setSubmitError("");
    try {
      setResult(
        await request<GradeResult>("/me/attempts", {
          method: "POST",
          body: {
            quizId: quiz.quizId,
            version: quiz.quizVersion,
            language: quiz.language,
            contentVersion: quiz.version,
            responses: quiz.questions.map((q) => ({
              questionId: q.id,
              response: responses[q.id],
            })),
          },
        }),
      );
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell>
      <View style={{ maxWidth: 780, width: "100%", alignSelf: "center" }}>
        <Pressable
          accessibilityRole="link"
          onPress={() =>
            router.push(metadata ? `/lesson/${metadata.lessonId}` : "/")
          }
          style={{ alignSelf: "flex-start", marginBottom: 25 }}
        >
          <Label style={{ fontSize: 13, color: colors.muted }}>
            ← {tr("Back to the lesson", "Retour à la leçon")}
          </Label>
        </Pressable>
        {catalogError ? (
          <ErrorBox message={catalogError} retry={retry} />
        ) : error ? (
          <ErrorBox message={error} retry={() => setAttempt((v) => v + 1)} />
        ) : !quiz ? (
          <Loading />
        ) : (
          <>
            <Label style={styles.eyebrow}>
              {tr("A MOMENT TO REFLECT", "UN MOMENT POUR RÉFLÉCHIR")}
            </Label>
            <Label
              display
              accessibilityRole="header"
              style={[
                styles.title,
                { fontSize: 34, lineHeight: 44, marginTop: 15 },
              ]}
            >
              {quiz.title}
            </Label>
            <Label
              style={[styles.subtitle, { marginTop: 12, marginBottom: 27 }]}
            >
              {tr(
                "No rush. Connect the ideas and see what stays with you.",
                "Prenez votre temps. Reliez les idées et découvrez ce que vous retenez.",
              )}
            </Label>
            {result ? (
              <View
                style={{
                  backgroundColor: "#E5EBD8",
                  borderRadius: 15,
                  padding: 28,
                  marginBottom: 25,
                }}
              >
                <Label style={styles.eyebrow}>
                  {tr("QUIZ COMPLETE", "QUIZ TERMINÉ")}
                </Label>
                <Label
                  display
                  style={{ fontSize: 48, lineHeight: 65, marginTop: 10 }}
                >
                  {result.score}%
                </Label>
                <Label>
                  {result.correctCount} / {result.total}{" "}
                  {tr(
                    "correct · Attempt saved",
                    "bonnes réponses · Résultat enregistré",
                  )}
                </Label>
                <Label style={{ color: colors.muted, marginTop: 8 }}>
                  {tr(
                    "Review the explanations below. Every attempt is a chance to learn.",
                    "Consultez les explications ci-dessous. Chaque essai est une occasion d’apprendre.",
                  )}
                </Label>
              </View>
            ) : (
              <View style={{ marginBottom: 25 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <Label style={{ fontSize: 12, color: colors.muted }}>
                    {tr("Your progress", "Votre progression")}
                  </Label>
                  <Label style={{ fontSize: 12 }}>
                    {answered} / {quiz.questions.length}
                  </Label>
                </View>
                <View
                  style={{
                    height: 5,
                    backgroundColor: colors.line,
                    borderRadius: 4,
                  }}
                >
                  <View
                    style={{
                      height: 5,
                      width: `${(answered / quiz.questions.length) * 100}%`,
                      backgroundColor: colors.green,
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>
            )}
            <View style={{ gap: 18 }}>
              {quiz.questions.map((q, index) => {
                const correction = result?.corrections.find(
                  (c) => c.questionId === q.id,
                );
                const answerLabel =
                  q.type === "multiple-choice"
                    ? q.options.find((o) => o.id === correction?.answer)?.text
                    : correction?.answer;
                return (
                  <View key={q.id} style={styles.card}>
                    <Label style={styles.eyebrow}>
                      {tr("QUESTION", "QUESTION")} {index + 1} ·{" "}
                      {q.type === "free-text"
                        ? tr("IN YOUR WORDS", "À VOUS DE RÉPONDRE")
                        : tr("CHOOSE ONE", "UN SEUL CHOIX")}
                    </Label>
                    <Label
                      display
                      style={{
                        fontSize: 22,
                        lineHeight: 31,
                        marginTop: 14,
                        marginBottom: 18,
                      }}
                    >
                      {q.prompt}
                    </Label>
                    {q.type === "multiple-choice" ? (
                      <View style={{ gap: 9 }}>
                        {q.options.map((option, i) => {
                          const selected = responses[q.id] === option.id;
                          const correct = correction?.answer === option.id;
                          return (
                            <Pressable
                              key={option.id}
                              accessibilityRole="radio"
                              accessibilityState={{
                                checked: selected,
                                disabled: !!result || busy,
                              }}
                              disabled={!!result || busy}
                              onPress={() =>
                                setResponses((old) => ({
                                  ...old,
                                  [q.id]: option.id,
                                }))
                              }
                              style={{
                                padding: 14,
                                borderWidth: 1,
                                borderColor: correct
                                  ? "#6A8E54"
                                  : selected
                                    ? colors.green
                                    : colors.line,
                                borderRadius: 10,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 13,
                                backgroundColor: correct
                                  ? "#ECF2E4"
                                  : selected
                                    ? "#F0F3EB"
                                    : "white",
                              }}
                            >
                              <View
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 13,
                                  borderWidth: 1,
                                  borderColor: selected
                                    ? colors.green
                                    : colors.line,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: selected
                                    ? colors.green
                                    : "transparent",
                                }}
                              >
                                <Label
                                  style={{
                                    fontSize: 11,
                                    color: selected ? "white" : colors.muted,
                                  }}
                                >
                                  {String.fromCharCode(65 + i)}
                                </Label>
                              </View>
                              <Label style={{ flex: 1, fontSize: 14 }}>
                                {option.text}
                              </Label>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : (
                      <TextInput
                        accessibilityLabel={q.prompt}
                        editable={!result && !busy}
                        value={responses[q.id] || ""}
                        onChangeText={(value) =>
                          setResponses((old) => ({ ...old, [q.id]: value }))
                        }
                        placeholder={tr("Type your answer…", "Votre réponse…")}
                        placeholderTextColor={colors.muted}
                        autoCorrect={false}
                        maxLength={2000}
                        style={styles.input}
                      />
                    )}
                    {correction && (
                      <View
                        accessibilityRole="alert"
                        style={{
                          marginTop: 18,
                          padding: 17,
                          backgroundColor: correction.correct
                            ? "#EFF4E8"
                            : "#FCF0E7",
                          borderRadius: 10,
                        }}
                      >
                        <Label style={{ fontFamily: "Medium", fontSize: 14 }}>
                          {correction.correct
                            ? tr("✓ Correct", "✓ Bonne réponse")
                            : tr(
                                "A chance to learn",
                                "Une occasion d’apprendre",
                              )}
                        </Label>
                        {!correction.correct && (
                          <Label style={{ fontSize: 14, marginTop: 6 }}>
                            {tr("Answer: ", "Réponse : ")}
                            {answerLabel}
                          </Label>
                        )}
                        <Label
                          style={{
                            fontSize: 13,
                            lineHeight: 22,
                            color: colors.muted,
                            marginTop: 6,
                          }}
                        >
                          {correction.explanation}
                        </Label>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
            {!!submitError && (
              <View style={{ marginTop: 20 }}>
                <ErrorBox message={submitError} />
              </View>
            )}
            <View style={{ marginTop: 25, gap: 12 }}>
              {!result ? (
                <>
                  <Button
                    disabled={busy || answered !== quiz.questions.length}
                    onPress={submit}
                  >
                    {busy
                      ? tr("Checking your answers…", "Vérification…")
                      : session
                        ? tr("Check my answers", "Vérifier mes réponses")
                        : tr(
                            "Sign in to save and check answers",
                            "Se connecter pour vérifier les réponses",
                          )}{" "}
                    →
                  </Button>
                  <Label
                    style={{
                      fontSize: 12,
                      color: colors.muted,
                      textAlign: "center",
                    }}
                  >
                    {tr(
                      "Answer every question before submitting. Switching language starts a new quiz.",
                      "Répondez à chaque question. Changer de langue recommence le quiz.",
                    )}
                  </Label>
                </>
              ) : (
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Button
                    onPress={() => {
                      setResult(null);
                      setResponses({});
                      setSubmitError("");
                    }}
                  >
                    {tr("Try again", "Réessayer")}
                  </Button>
                  <Button secondary onPress={() => router.push("/progress")}>
                    {tr("View my learning", "Mon apprentissage")} →
                  </Button>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </Shell>
  );
}
