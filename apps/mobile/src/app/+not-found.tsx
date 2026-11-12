import { router } from "expo-router";
import { View } from "react-native";
import { Shell } from "../components/Shell";
import { Button, Label } from "../components/ui";
import { useApp } from "../lib/state";
export default function NotFound() {
  const { tr } = useApp();
  return (
    <Shell>
      <View style={{ gap: 20 }}>
        <Label display style={{ fontSize: 32 }}>
          {tr(
            "This page is not in the library.",
            "Cette page ne figure pas dans la bibliothèque.",
          )}
        </Label>
        <Button onPress={() => router.replace("/")}>
          {tr("Back to exploring", "Retour à la découverte")}
        </Button>
      </View>
    </Shell>
  );
}
