import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "../lib/fonts";
import { AppProvider } from "../lib/state";
import { Loading } from "../components/ui";
export default function Layout() {
  const [loaded, error] = useFonts({
    Body: PlusJakartaSans_400Regular,
    Medium: PlusJakartaSans_600SemiBold,
    Display: PlusJakartaSans_700Bold,
  });
  if (!loaded && !error) return <Loading />;
  return (
    <AppProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F6F6F1" },
          animation: "none",
        }}
      />
    </AppProvider>
  );
}
