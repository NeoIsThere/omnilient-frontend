import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native";
export const colors = {
  paper: "#F6F6F1",
  ink: "#253A32",
  muted: "#707870",
  green: "#294D3D",
  line: "#E1E4DA",
  lime: "#DCE8BC",
  white: "#FFFFFF",
};
export function Label({
  children,
  style,
  display = false,
  ...props
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  display?: boolean;
  numberOfLines?: number;
  accessibilityRole?: "header";
}) {
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: display ? "Display" : "Body",
          color: colors.ink,
          fontSize: 15,
          lineHeight: 23,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Button({
  children,
  onPress,
  secondary = false,
  disabled = false,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({
        pressed,
        hovered,
      }: {
        pressed: boolean;
        hovered?: boolean;
      }) => [
        {
          borderRadius: 10,
          paddingVertical: 13,
          paddingHorizontal: 20,
          backgroundColor: secondary ? "transparent" : colors.green,
          borderWidth: 1,
          borderColor: secondary ? colors.line : colors.green,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
          alignItems: "center",
        },
        hovered && !disabled ? { borderColor: "#6E8964" } : null,
        style,
      ]}
    >
      <Label
        style={{
          fontFamily: "Medium",
          color: secondary ? colors.ink : "white",
          fontSize: 14,
        }}
      >
        {children}
      </Label>
    </Pressable>
  );
}
export function ErrorBox({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <View
      accessibilityRole="alert"
      style={{
        padding: 20,
        backgroundColor: "#F9E9E3",
        borderRadius: 12,
        gap: 12,
      }}
    >
      <Label style={{ color: "#823C28" }}>{message}</Label>
      {retry && (
        <Button secondary onPress={retry}>
          Try again · Réessayer
        </Button>
      )}
    </View>
  );
}
export function Loading() {
  return (
    <View style={{ padding: 70, alignItems: "center" }}>
      <ActivityIndicator size="large" color={colors.green} />
    </View>
  );
}
export const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: "Medium",
    fontSize: 11,
    letterSpacing: 2,
    color: colors.muted,
    textTransform: "uppercase",
  },
  title: { fontSize: 40, lineHeight: 51, letterSpacing: -1.2 },
  subtitle: { fontSize: 16, lineHeight: 26, color: colors.muted },
  input: {
    fontFamily: "Body",
    fontSize: 16,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 14,
    backgroundColor: "white",
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 24,
  },
});
