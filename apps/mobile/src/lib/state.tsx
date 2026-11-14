import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Catalog, Language, Progress } from "@omnilient/contracts";
import { api, ApiError, content } from "./client";
import { Loading } from "../components/ui";
type Session = {
  token: string;
  user: { id: string; name: string; email: string; isAdmin: boolean };
};
const sessionKey = "omnilient:session";
function storedSession(value: string | null): Session | null {
  if (!value) return null;
  try {
    const session = JSON.parse(value) as Session;
    if (
      typeof session.token === "string" &&
      typeof session.user?.id === "string" &&
      typeof session.user.name === "string" &&
      typeof session.user.email === "string" &&
      typeof session.user.isAdmin === "boolean"
    ) return session;
  } catch {}
  return null;
}
function useStateValue() {
  const [language, setLanguageState] = useState<Language>("en");
  const [catalogState, setCatalogState] = useState<{
    language: Language;
    reload: number;
    data: Catalog | null;
    error: string;
    offline: boolean;
  } | null>(null);
  const [reload, setReload] = useState(0);
  const catalogCurrent =
    catalogState?.language === language && catalogState.reload === reload;
  const catalog = catalogCurrent ? catalogState.data : null,
    error = catalogCurrent ? catalogState.error : "",
    offline = catalogCurrent ? catalogState.offline : false;
  const [session, setSession] = useState<Session | null>(null),
    [sessionReady, setSessionReady] = useState(false),
    [progressState, setProgressState] = useState<{
      userId: string;
      items: Progress[];
    }>({ userId: "", items: [] });
  const progress =
    session?.user.id === progressState.userId ? progressState.items : [];
  const tr = useCallback(
    (en: string, fr: string) => (language === "en" ? en : fr),
    [language],
  );
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(sessionKey)
      .then((value) => {
        if (active) setSession(storedSession(value));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setSessionReady(true);
      });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!sessionReady) return;
    (session
      ? AsyncStorage.setItem(sessionKey, JSON.stringify(session))
      : AsyncStorage.removeItem(sessionKey)
    ).catch(() => {});
  }, [session, sessionReady]);
  useEffect(() => {
    // Retire caches from the initial scaffold without touching user preferences.
    AsyncStorage.getAllKeys()
      .then((keys) =>
        AsyncStorage.multiRemove(
          keys.filter(
            (key) =>
              key.startsWith("omnilient:v1:") ||
              key.startsWith("omnilient:content:") ||
              key.startsWith("omnilient:catalog:"),
          ),
        ),
      )
      .catch(() => {});
    AsyncStorage.getItem("omnilient:language")
      .then((v) => {
        if (v === "fr") setLanguageState(v);
      })
      .catch(() => {});
  }, []);
  const setLanguage = (value: Language) => {
    setLanguageState(value);
    AsyncStorage.setItem("omnilient:language", value).catch(() => {});
  };
  useEffect(() => {
    let active = true;
    api<Catalog>(`/catalog?language=${language}`)
      .then((data) => {
        if (!active) return;
        setCatalogState({ language, reload, data, error: "", offline: false });
        AsyncStorage.setItem(
          `omnilient:v2:catalog:${language}`,
          JSON.stringify(data),
        ).catch(() => {});
        const first = data.disciplines.flatMap((d) =>
          d.topics.flatMap((t) => t.lessons),
        )[0];
        if (first)
          content(
            "lessons",
            data.cdnBaseUrl,
            first.id,
            language,
            first.version,
          ).catch(() => {});
      })
      .catch(async (e) => {
        if (!active) return;
        try {
          const cached = await AsyncStorage.getItem(
            `omnilient:v2:catalog:${language}`,
          );
          if (cached && active) {
            const value = JSON.parse(cached);
            if (
              value.language === language &&
              Array.isArray(value.disciplines)
            ) {
              setCatalogState({
                language,
                reload,
                data: value,
                error: "",
                offline: true,
              });
              return;
            }
          }
        } catch {}
        if (active)
          setCatalogState({
            language,
            reload,
            data: null,
            error: e.message,
            offline: false,
          });
      });
    return () => {
      active = false;
    };
  }, [language, reload]);
  const request = useCallback(
    async <T,>(
      path: string,
      options: { method?: string; body?: unknown } = {},
    ): Promise<T> => {
      if (!session)
        throw new Error(
          tr(
            "Sign in to save your learning.",
            "Connectez-vous pour enregistrer votre progression.",
          ),
        );
      try {
        return await api<T>(path, { ...options, token: session.token });
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          setSession((old) => (old?.token === session.token ? null : old));
        }
        throw e;
      }
    },
    [session, tr],
  );
  useEffect(() => {
    let active = true;
    if (session)
      api<Progress[]>("/me/progress", { token: session.token })
        .then((v) => {
          if (active) setProgressState({ userId: session.user.id, items: v });
        })
        .catch((e) => {
          if (active && e instanceof ApiError && e.status === 401)
            setSession((old) => (old?.token === session.token ? null : old));
        });
    return () => {
      active = false;
    };
  }, [session, request]);
  const saveProgress = async (lessonId: string, completed: boolean) => {
    const value = await request<Progress>(`/me/progress/${lessonId}`, {
      method: "PUT",
      body: { completed },
    });
    if (session)
      setProgressState((old) => ({
        userId: session.user.id,
        items: [
          ...(old.userId === session.user.id ? old.items : []).filter(
            (p) => p.lessonId !== lessonId,
          ),
          value,
        ],
      }));
  };
  return {
    language,
    setLanguage,
    tr,
    catalog,
    error,
    offline,
    retry: () => setReload((v) => v + 1),
    session,
    sessionReady,
    setSession,
    progress,
    saveProgress,
    request,
  };
}
const Context = createContext<ReturnType<typeof useStateValue> | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const value = useStateValue();
  return <Context.Provider value={value}>{value.sessionReady ? children : <Loading />}</Context.Provider>;
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing AppProvider");
  return value;
}
