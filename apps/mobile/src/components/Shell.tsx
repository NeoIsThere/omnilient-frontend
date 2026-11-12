import React from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { router, usePathname } from "expo-router";
import { useApp } from "../lib/state";
import { colors, Label } from "./ui";
export function Shell({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions(),
    wide = width >= 1000;
  const path = usePathname(),
    { tr, language, setLanguage, session, setSession, offline } = useApp();
  const navigation = [
    { path: "/" as const, label: tr("Explore", "Explorer"), icon: "▦" },
    {
      path: "/progress" as const,
      label: tr("My learning", "Mon apprentissage"),
      icon: "◷",
    },
  ];
  const nav = (
    <>
      {navigation.map((n) => (
        <Pressable
          key={n.path}
          accessibilityRole="link"
          onPress={() => router.push(n.path)}
          style={{
            flexDirection: "row",
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 13,
            borderRadius: 9,
            backgroundColor: path === n.path ? "#E5EBDD" : "transparent",
          }}
        >
          <Label style={{ fontSize: 20, color: colors.green }}>{n.icon}</Label>
          <Label
            style={{
              fontFamily: path === n.path ? "Medium" : "Body",
              fontSize: 14,
            }}
          >
            {n.label}
          </Label>
        </Pressable>
      ))}
    </>
  );
  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, flexDirection: "row" }}
    >
      {wide && (
        <View
          style={{
            width: 224,
            borderRightWidth: 1,
            borderColor: colors.line,
            padding: 22,
            paddingTop: 32,
            backgroundColor: "#F1F3EB",
          }}
        >
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Omnilient home"
            onPress={() => router.push("/")}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 9,
                paddingHorizontal: 8,
              }}
            >
              <Label
                style={{ fontSize: 31, lineHeight: 38, color: colors.green }}
              >
                ✳
              </Label>
              <Label display style={{ fontSize: 26, letterSpacing: -1 }}>
                omnilient
              </Label>
            </View>
          </Pressable>
          <Label
            style={{
              fontSize: 10,
              letterSpacing: 2,
              color: colors.muted,
              marginTop: 39,
              marginBottom: 12,
              paddingLeft: 16,
            }}
          >
            {tr("YOUR LIBRARY", "VOTRE BIBLIOTHÈQUE")}
          </Label>
          {nav}
          <View style={{ flex: 1 }} />
          <View
            style={{
              padding: 17,
              backgroundColor: "#E5EBDD",
              borderRadius: 12,
              gap: 9,
            }}
          >
            <Label style={{ fontSize: 24 }}>✧</Label>
            <Label display style={{ fontSize: 18 }}>
              {tr("Stay curious.", "Restez curieux.")}
            </Label>
            <Label
              style={{ fontSize: 12, lineHeight: 19, color: colors.muted }}
            >
              {tr(
                "A little understanding, every day.",
                "Un peu de compréhension, chaque jour.",
              )}
            </Label>
          </View>
          <Label
            style={{
              fontSize: 11,
              color: colors.muted,
              marginTop: 22,
              paddingLeft: 8,
            }}
          >
            {tr("A world worth understanding.", "Un monde à comprendre.")}
          </Label>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            paddingHorizontal: wide ? 44 : 20,
            paddingVertical: 19,
            borderBottomWidth: 1,
            borderColor: colors.line,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          {wide ? (
            <Label style={{ fontSize: 13, color: colors.muted }}>
              {tr("Make room for discovery.", "Faites place à la découverte.")}
            </Label>
          ) : (
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push("/")}
            >
              <Label display style={{ fontSize: 23 }}>
                ✳ omnilient
              </Label>
            </Pressable>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
            <View
              style={{
                flexDirection: "row",
                padding: 3,
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: 8,
              }}
            >
              {(["en", "fr"] as const).map((l) => (
                <Pressable
                  key={l}
                  accessibilityRole="button"
                  accessibilityLabel={
                    l === "en" ? "Switch to English" : "Passer en français"
                  }
                  accessibilityState={{ selected: language === l }}
                  onPress={() => setLanguage(l)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 5,
                    backgroundColor: language === l ? "white" : "transparent",
                  }}
                >
                  <Label
                    style={{
                      fontSize: 11,
                      fontFamily: language === l ? "Medium" : "Body",
                    }}
                  >
                    {l.toUpperCase()}
                  </Label>
                </Pressable>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                session ? setSession(null) : router.push("/sign-in")
              }
            >
              <Label style={{ fontSize: 13 }}>
                {session
                  ? `${session.user.name} · ${tr("Sign out", "Déconnexion")}`
                  : tr("Sign in ↗", "Connexion ↗")}
              </Label>
            </Pressable>
          </View>
        </View>
        {!wide && (
          <View
            style={{
              flexDirection: "row",
              padding: 8,
              borderBottomWidth: 1,
              borderColor: colors.line,
            }}
          >
            {nav}
          </View>
        )}
        {offline && (
          <View style={{ padding: 10, backgroundColor: colors.lime }}>
            <Label style={{ textAlign: "center", fontSize: 12 }}>
              {tr(
                "Offline library · Previously opened lessons are available.",
                "Bibliothèque hors ligne · Les leçons déjà ouvertes restent disponibles.",
              )}
            </Label>
          </View>
        )}
        <ScrollView
          key={path}
          contentContainerStyle={{
            padding: wide ? 44 : 20,
            paddingBottom: 60,
            alignItems: "center",
          }}
        >
          <View style={{ width: "100%", maxWidth: 1130 }}>{children}</View>
        </ScrollView>
      </View>
    </View>
  );
}
