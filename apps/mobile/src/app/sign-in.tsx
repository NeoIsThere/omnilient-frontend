import React, { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useApp } from "../lib/state";
import { api } from "../lib/client";
import { Shell } from "../components/Shell";
import { Button, colors, ErrorBox, Label, styles } from "../components/ui";
export default function SignIn() {
  const { tr, setSession } = useApp(),
    { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [register, setRegister] = useState(false),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await api<{
        token: string;
        user: { id: string; name: string; email: string; isAdmin: boolean };
      }>(`/auth/${register ? "register" : "login"}`, {
        method: "POST",
        body: { email, password, ...(register ? { name } : {}) },
      });
      setSession(response);
      router.replace(
        returnTo && /^\/(lesson|quiz)\/[a-z0-9-]+$/.test(returnTo)
          ? (returnTo as "/")
          : "/progress",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell>
      <View
        style={{
          maxWidth: 460,
          width: "100%",
          alignSelf: "center",
          marginTop: 25,
        }}
      >
        <Label style={styles.eyebrow}>
          {tr("YOUR OWN LEARNING JOURNEY", "VOTRE PARCOURS PERSONNEL")}
        </Label>
        <Label
          display
          accessibilityRole="header"
          style={[styles.title, { marginTop: 16, fontSize: 36 }]}
        >
          {register
            ? tr("Curiosity starts here.", "La curiosité commence ici.")
            : tr("Welcome back.", "Heureux de vous retrouver.")}
        </Label>
        <Label style={[styles.subtitle, { marginTop: 12, marginBottom: 28 }]}>
          {tr(
            "Keep your progress and see how your understanding grows.",
            "Gardez votre progression et suivez vos découvertes.",
          )}
        </Label>
        <View style={[styles.card, { gap: 17 }]}>
          {register && (
            <View style={{ gap: 6 }}>
              <Label style={{ fontSize: 13 }}>{tr("Name", "Prénom")}</Label>
              <TextInput
                accessibilityLabel={tr("Name", "Prénom")}
                value={name}
                onChangeText={setName}
                autoComplete="name"
                maxLength={80}
                style={styles.input}
              />
            </View>
          )}
          <View style={{ gap: 6 }}>
            <Label style={{ fontSize: 13 }}>
              {tr("Email address", "Adresse e-mail")}
            </Label>
            <TextInput
              accessibilityLabel={tr("Email address", "Adresse e-mail")}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
          </View>
          <View style={{ gap: 6 }}>
            <Label style={{ fontSize: 13 }}>
              {tr("Password", "Mot de passe")}
            </Label>
            <TextInput
              accessibilityLabel={tr("Password", "Mot de passe")}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={register ? "new-password" : "current-password"}
              value={password}
              onChangeText={setPassword}
              maxLength={128}
              style={styles.input}
              onSubmitEditing={() => submit()}
            />
            {register && (
              <Label style={{ fontSize: 11, color: colors.muted }}>
                {tr("At least 10 characters.", "Au moins 10 caractères.")}
              </Label>
            )}
          </View>
          {!!error && <ErrorBox message={error} />}
          <Button
            disabled={
              busy ||
              !email ||
              password.length < 10 ||
              (register && !name.trim())
            }
            onPress={() => submit()}
          >
            {busy
              ? tr("One moment…", "Un instant…")
              : register
                ? tr("Create account", "Créer un compte")
                : tr("Sign in", "Se connecter")}
          </Button>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setRegister(!register);
              setError("");
            }}
          >
            <Label
              style={{
                fontSize: 13,
                textAlign: "center",
                textDecorationLine: "underline",
              }}
            >
              {register
                ? tr(
                    "Already have an account? Sign in",
                    "Déjà un compte ? Connectez-vous",
                  )
                : tr(
                    "New here? Create an account",
                    "Première visite ? Créez un compte",
                  )}
            </Label>
          </Pressable>
        </View>
      </View>
    </Shell>
  );
}
