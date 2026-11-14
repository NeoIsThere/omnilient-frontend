import { useState } from "react";
import { Pressable, View } from "react-native";
import { useApp } from "../lib/state";
import { Label } from "./ui";

export function DeleteControl({ kind, id, name, onDeleted }: { kind: "subjects" | "topics"; id: string; name: string; onDeleted?: () => void }) {
  const { session, request, retry, tr } = useApp();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!session?.user.isAdmin) return null;
  const remove = async () => {
    setBusy(true); setError("");
    try {
      await request(`/admin/${kind}/${id}`, { method: "DELETE" });
      retry(); onDeleted?.();
    } catch (e) { setError((e as Error).message); setBusy(false); }
  };
  return <View style={{ alignItems: "flex-start", gap: 5 }}>
    {!confirm ? <Pressable accessibilityRole="button" onPress={() => setConfirm(true)}>
      <Label style={{ color: "#9B2F2F", fontSize: 12 }}>{tr("Delete", "Supprimer")}</Label>
    </Pressable> : <View style={{ gap: 7 }}>
      <Label style={{ fontSize: 12, color: "#9B2F2F" }}>
        {tr(`Delete “${name}” and all its topics, lessons, quizzes and unused images? This cannot be undone.`,
          `Supprimer « ${name} » et tous ses thèmes, leçons, quiz et images inutilisées ? Cette action est irréversible.`)}
      </Label>
      <View style={{ flexDirection: "row", gap: 16 }}>
        <Pressable accessibilityRole="button" disabled={busy} onPress={remove}><Label style={{ color: "#9B2F2F", fontFamily: "Medium" }}>{busy ? tr("Deleting…", "Suppression…") : tr("Confirm delete", "Confirmer")}</Label></Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => setConfirm(false)}><Label>{tr("Cancel", "Annuler")}</Label></Pressable>
      </View>
    </View>}
    {!!error && <Label style={{ color: "#9B2F2F", fontSize: 12 }}>{error}</Label>}
  </View>;
}
