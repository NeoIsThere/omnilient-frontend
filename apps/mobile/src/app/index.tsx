import React, { useState } from "react";
import { Pressable, TextInput, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useApp } from "../lib/state";
import { Shell } from "../components/Shell";
import { displayLessonTitle, displayTopicName, numberTopics } from "../lib/topic-numbering";
import {
  Button,
  colors,
  ErrorBox,
  Label,
  Loading,
  styles,
} from "../components/ui";
export default function Explore() {
  const { tr, catalog, error, retry, language, session } = useApp();
  const { width } = useWindowDimensions(),
    compact = width < 700;
  const [query, setQuery] = useState("");
  if (!catalog)
    return (
      <Shell>
        {error ? <ErrorBox message={error} retry={retry} /> : <Loading />}
      </Shell>
    );
  const lessons = catalog.disciplines.flatMap((d) => {
    const numbers = numberTopics(d.topics);
    return d.topics.flatMap((t) =>
      t.lessons.map((l) => ({
        ...l,
        title: displayLessonTitle(l.title, t.id, numbers),
        discipline: d.name,
        disciplineId: d.id,
        topic: displayTopicName(t, numbers),
      })),
    );
  });
  const term = query.trim().toLocaleLowerCase(language);
  const matches = (value: string) => value.toLocaleLowerCase(language).includes(term);
  const visibleDisciplines = catalog.disciplines.filter(d => {
    const numbers = numberTopics(d.topics);
    return matches(d.name) || d.topics.some(t =>
      matches(displayTopicName(t, numbers)) ||
      t.lessons.some(l => matches(`${displayLessonTitle(l.title, t.id, numbers)} ${l.summary}`)));
  });
  const featured = lessons[0];
  return (
    <Shell>
      <Label style={styles.eyebrow}>
        {tr("THE JOY OF KNOWING", "LE PLAISIR DE COMPRENDRE")}
      </Label>
      <Label
        display
        accessibilityRole="header"
        style={[
          styles.title,
          {
            marginTop: 12,
            fontSize: compact ? 34 : 43,
            lineHeight: compact ? 43 : 56,
          },
        ]}
      >
        {tr("A little wiser, every day.", "Un peu plus éclairé, chaque jour.")}
      </Label>
      <Label style={[styles.subtitle, { marginTop: 10, marginBottom: 30 }]}>
        {tr(
          "Follow your curiosity. Discover the ideas that connect our world.",
          "Suivez votre curiosité. Découvrez les idées qui relient notre monde.",
        )}
      </Label>
      {featured && !query && (
        <View
          style={{
            borderRadius: 18,
            backgroundColor: "#E5EBD8",
            overflow: "hidden",
            flexDirection: "row",
            minHeight: 265,
            marginBottom: 37,
          }}
        >
          <View
            style={{
              flex: 1,
              padding: compact ? 25 : 34,
              zIndex: 1,
              maxWidth: 650,
            }}
          >
            <Label style={[styles.eyebrow, { color: "#596A48", fontSize: 10 }]}>
              {tr("A GOOD PLACE TO BEGIN", "UN BON POINT DE DÉPART")} /{" "}
              {featured.discipline.toLocaleUpperCase(language)}
            </Label>
            <Label
              display
              style={{
                fontSize: compact ? 28 : 34,
                lineHeight: 43,
                marginTop: 18,
                maxWidth: 470,
              }}
            >
              {featured.title}
            </Label>
            <Label
              style={{
                color: "#64715C",
                marginTop: 10,
                maxWidth: 395,
                fontSize: 14,
                lineHeight: 23,
              }}
            >
              {featured.summary}
            </Label>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 18,
                marginTop: 23,
                flexWrap: "wrap",
              }}
            >
              <Button onPress={() => router.push(`/lesson/${featured.id}`)}>
                {tr("Start exploring", "Commencer")} →
              </Button>
              <Label style={{ fontSize: 12, color: "#66725D" }}>
                {featured.minutes} min ·{" "}
                {tr("Beginner friendly", "Pour débuter")}
              </Label>
            </View>
          </View>
          {!compact && (
            <View
              accessibilityElementsHidden
              style={{
                width: 235,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  width: 290,
                  height: 290,
                  borderRadius: 145,
                  borderWidth: 1,
                  borderColor: "#B9C7A4",
                  right: -65,
                  top: 40,
                }}
              />
              <View
                style={{
                  position: "absolute",
                  width: 210,
                  height: 210,
                  borderRadius: 105,
                  borderWidth: 1,
                  borderColor: "#B9C7A4",
                  right: -25,
                  top: 80,
                }}
              />
              <View
                style={{
                  width: 140,
                  height: 180,
                  borderRadius: 75,
                  backgroundColor: "#B8CBA1",
                  transform: [{ rotate: "-30deg" }],
                  borderWidth: 1,
                  borderColor: "#8AA071",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: 62,
                    height: 70,
                    borderRadius: 40,
                    backgroundColor: "#577649",
                    borderWidth: 9,
                    borderColor: "#96AF7C",
                  }}
                />
                <View
                  style={{
                    width: 16,
                    height: 28,
                    borderRadius: 12,
                    backgroundColor: "#6F8E5B",
                    position: "absolute",
                    left: 17,
                    top: 30,
                  }}
                />
                <View
                  style={{
                    width: 15,
                    height: 22,
                    borderRadius: 12,
                    backgroundColor: "#809B64",
                    position: "absolute",
                    bottom: 24,
                    right: 21,
                  }}
                />
              </View>
              <Label
                style={{
                  position: "absolute",
                  bottom: 16,
                  right: 24,
                  fontSize: 10,
                  letterSpacing: 2,
                  color: "#6F815C",
                }}
              >
                01 / {tr("LIFE", "VIE")}
              </Label>
            </View>
          )}
        </View>
      )}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
          gap: 12,
        }}
      >
        <Label
          display
          accessibilityRole="header"
          style={{ fontSize: 25, lineHeight: 33 }}
        >
          {tr("Find your next fascination", "Trouvez votre prochaine passion")}
        </Label>
        <Label style={{ fontSize: 12, color: colors.muted }}>
          {catalog.disciplines.length} {tr("disciplines", "disciplines")}
        </Label>
      </View>
      <TextInput accessibilityLabel={tr("Search the library", "Rechercher dans la bibliothèque")}
        value={query} onChangeText={setQuery} placeholder={tr("Search disciplines, topics and lessons…", "Rechercher des disciplines, thèmes et leçons…")}
        placeholderTextColor={colors.muted} style={[styles.input, { marginBottom: 20, fontSize: 14 }]} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {visibleDisciplines.map((d) => {
          const count = d.topics.reduce((n, t) => n + t.lessons.length, 0);
          return (
            <Pressable
              key={d.id}
              accessibilityRole="link"
              accessibilityLabel={`Open ${d.name}`}
              onPress={() => router.push({ pathname: "/discipline/[id]", params: { id: d.id, ...(query ? { q: matches(d.name) ? "" : query } : {}) } })}
              style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [
                {
                  width: compact ? "100%" : width < 1300 ? "48.5%" : "32%",
                  minHeight: 198,
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor:
                    hovered
                        ? "#A5B394"
                        : colors.line,
                  borderRadius: 13,
                  padding: 22,
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    backgroundColor: d.color,
                    borderRadius: 11,
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Label style={{ fontSize: 27, lineHeight: 32 }}>
                    {d.symbol}
                  </Label>
                </View>
                <Label style={{ color: "#8D958A" }}>↗</Label>
              </View>
              <Label display style={{ fontSize: 21, marginTop: 16 }}>
                {d.name}
              </Label>
              <Label
                style={{
                  fontSize: 12,
                  lineHeight: 19,
                  color: colors.muted,
                  marginTop: 7,
                  flex: 1,
                }}
              >
                {d.description}
              </Label>
              <Label
                style={{
                  fontSize: 10,
                  color: colors.muted,
                  marginTop: 15,
                  letterSpacing: 0.5,
                }}
              >
                {d.topics.length} {tr("TOPICS", "THÈMES")}
                {count > 0 && ` · ${count} ${count === 1 ? tr("LESSON", "LEÇON") : tr("LESSONS", "LEÇONS")}`}
              </Label>
            </Pressable>
          );
        })}
      </View>
      {!visibleDisciplines.length && <Label style={{ marginTop: 24, color: colors.muted }}>
        {tr("No matching disciplines, topics or lessons.", "Aucune discipline, aucun thème ni aucune leçon correspondants.")}
      </Label>}
      {!session && (
        <View
          style={{
            marginTop: 30,
            paddingTop: 22,
            borderTopWidth: 1,
            borderColor: colors.line,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 15,
            flexWrap: "wrap",
          }}
        >
          <Label style={{ fontSize: 13, color: colors.muted }}>
            {tr(
              "Make this learning journey yours. Save your progress as you go.",
              "Personnalisez votre parcours. Enregistrez votre progression.",
            )}
          </Label>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/sign-in")}
          >
            <Label style={{ fontSize: 13, fontFamily: "Medium" }}>
              {tr("Create an account", "Créer un compte")} ↗
            </Label>
          </Pressable>
        </View>
      )}
    </Shell>
  );
}
