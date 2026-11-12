import { useState } from "react";
import { Image, View } from "react-native";
import { imageUrl } from "@omnilient/contracts";
import { Button, colors, Label } from "./ui";
import { useApp } from "../lib/state";
type Props = { base: string; imageId: string; alt: string; caption?: string };
export function LessonImage(props: Props) {
  return <ImageContent key={imageUrl(props.base, props.imageId)} {...props} />;
}
function ImageContent({ base, imageId, alt, caption }: Props) {
  const { tr } = useApp(),
    [failed, setFailed] = useState(false),
    [attempt, setAttempt] = useState(0);
  const url = imageUrl(base, imageId);
  return (
    <View style={{ marginVertical: 20 }}>
      {failed ? (
        <View
          style={{
            height: 220,
            borderRadius: 12,
            backgroundColor: colors.line,
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            gap: 12,
          }}
        >
          <Label style={{ textAlign: "center" }}>{alt}</Label>
          <Label style={{ fontSize: 12, color: colors.muted }}>
            {tr("Image not available yet.", "Image pas encore disponible.")}
          </Label>
          <Button
            secondary
            onPress={() => {
              setFailed(false);
              setAttempt((n) => n + 1);
            }}
          >
            {tr("Retry image", "Réessayer")}
          </Button>
        </View>
      ) : (
        <Image
          key={attempt}
          source={{ uri: attempt ? `${url}?retry=${attempt}` : url }}
          accessibilityLabel={alt}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: 300, resizeMode: "contain" }}
        />
      )}
      {!!caption && (
        <Label
          style={{
            fontSize: 12,
            color: colors.muted,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          {caption}
        </Label>
      )}
    </View>
  );
}
