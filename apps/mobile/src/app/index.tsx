import React, { useState } from "react";
import { Pressable, TextInput, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useApp } from "../lib/state";
import { content } from "../lib/client";
import { Shell } from "../components/Shell";
import { TopicTree } from "../components/TopicTree";
import {
  Button,
  colors,
  ErrorBox,
  Label,
  Loading,
  styles,
} from "../components/ui";
export default function Explore() {
  const { tr, catalog, error, retry, language, progress, session } = useApp();
  const { width } = useWindowDimensions(),
    compact = width < 700;
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState<string | null>(null);
  if (!catalog)
    return (
      <Shell>
        {error ? <ErrorBox message={error} retry={retry} /> : <Loading />}
      </Shell>
    );
  const lessons = catalog.disciplines.flatMap((d) =>
    d.topics.flatMap((t) =>
      t.lessons.map((l) => ({
        ...l,
        discipline: d.name,
        disciplineId: d.id,
        topic: t.name,
      })),
    ),
  );
  const filtered = lessons.filter(
    (l) =>
      (!selected || selected === l.disciplineId) &&
      `${l.title} ${l.topic} ${l.discipline}`
        .toLocaleLowerCase(language)
        .includes(query.toLocaleLowerCase(language)),
  );
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
      {featured && !query && !selected && (
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
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {catalog.disciplines.map((d) => {
          const count = d.topics.reduce((n, t) => n + t.lessons.length, 0);
          return (
            <Pressable
              key={d.id}
              accessibilityRole="button"
              accessibilityState={{ selected: selected === d.id }}
              onPress={() => setSelected(selected === d.id ? null : d.id)}
              style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [
                {
                  width: compact ? "100%" : width < 1300 ? "48.5%" : "32%",
                  minHeight: 198,
                  backgroundColor: selected === d.id ? "#F0F4E9" : "#FFFFFF",
                  borderWidth: 1,
                  borderColor:
                    selected === d.id
                      ? "#577649"
                      : hovered
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
                {count
                  ? `${count} ${tr("LESSON AVAILABLE", "LEÇON DISPONIBLE")}`
                  : tr("CURRICULUM IN PREPARATION", "PROGRAMME EN PRÉPARATION")}
              </Label>
            </Pressable>
          );
        })}
      </View>
      <View
        style={{
          marginTop: 39,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <Label display accessibilityRole="header" style={{ fontSize: 25 }}>
          {selected
            ? catalog.disciplines.find((d) => d.id === selected)?.name
            : tr("Your next discovery", "Votre prochaine découverte")}
        </Label>
        <TextInput
          accessibilityLabel={tr("Search lessons", "Rechercher des leçons")}
          value={query}
          onChangeText={setQuery}
          placeholder={tr(
            "Search the library…",
            "Rechercher dans la bibliothèque…",
          )}
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            {
              fontSize: 13,
              minWidth: compact ? "100%" : 275,
              paddingVertical: 10,
            },
          ]}
        />
      </View>
      {selected && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setSelected(null)}
          style={{ alignSelf: "flex-start", paddingVertical: 15 }}
        >
          <Label style={{ fontSize: 12 }}>
            × {tr("Show all disciplines", "Afficher toutes les disciplines")}
          </Label>
        </Pressable>
      )}
      {selected && (
        <TopicTree
          topics={
            catalog.disciplines.find((d) => d.id === selected)?.topics || []
          }
        />
      )}
      <View style={{ marginTop: 18, gap: 12 }}>
        {filtered.map((l) => (
          <Pressable
            key={l.id}
            accessibilityRole="link"
            onHoverIn={() =>
              content(
                "lessons",
                catalog.cdnBaseUrl,
                l.id,
                language,
                l.version,
              ).catch(() => {})
            }
            onPress={() => router.push(`/lesson/${l.id}`)}
            style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [
              styles.card,
              {
                flexDirection: "row",
                gap: 18,
                alignItems: "center",
                borderColor: hovered ? "#A5B394" : colors.line,
              },
            ]}
          >
            <View
              style={{
                width: 50,
                height: 55,
                borderRadius: 9,
                backgroundColor: "#E5EBD8",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Label style={{ fontSize: 26 }}>◉</Label>
            </View>
            <View style={{ flex: 1 }}>
              <Label
                style={{ fontSize: 10, letterSpacing: 1, color: colors.muted }}
              >
                {l.discipline.toLocaleUpperCase(language)} · {l.minutes} MIN
              </Label>
              <Label display style={{ fontSize: 19, marginTop: 5 }}>
                {l.title}
              </Label>
              <Label
                style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}
              >
                {l.topic}
              </Label>
            </View>
            <Label>
              {progress.some((p) => p.lessonId === l.id && p.completed)
                ? "✓"
                : "→"}
            </Label>
          </Pressable>
        ))}
        {!filtered.length && (
          <View style={[styles.card, { padding: 28 }]}>
            <Label display style={{ fontSize: 22 }}>
              {query
                ? tr("No lessons found", "Aucune leçon trouvée")
                : tr(
                    "Good things take a little time.",
                    "Les belles choses prennent du temps.",
                  )}
            </Label>
            <Label style={{ color: colors.muted, marginTop: 8 }}>
              {query
                ? tr(
                    "Try a different search or clear the discipline filter.",
                    "Essayez une autre recherche ou retirez le filtre.",
                  )
                : tr(
                    "No lessons have been published yet. Your library is ready for future content.",
                    "Aucune leçon n’a encore été publiée. Votre bibliothèque est prête à accueillir du contenu.",
                  )}
            </Label>
          </View>
        )}
      </View>
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
