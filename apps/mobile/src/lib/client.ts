import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  contentUrl,
  LessonContentSchema,
  QuizContentSchema,
  type Language,
  type LessonContent,
  type QuizContent,
} from "@omnilient/contracts";
const API = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: { token?: string; method?: string; body?: unknown } = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API}${path}`, {
      method: options.method || "GET",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    });
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(
        Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Request failed",
        response.status,
      );
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error("Unable to connect. Check that the local API is running.");
  } finally {
    clearTimeout(timeout);
  }
}
const inflight = new Map<string, Promise<LessonContent | QuizContent>>();
const prefix = "omnilient:v1:content:";
async function fetchContent(
  kind: "lessons" | "quizzes",
  base: string,
  id: string,
  language: Language,
  version: number,
) {
  const url = contentUrl(base, kind, id, language, version),
    key = prefix + url;
  const validate = (raw: unknown) => {
    const value =
      kind === "lessons"
        ? LessonContentSchema.parse(raw)
        : QuizContentSchema.parse(raw);
    if (
      ("lessonId" in value ? value.lessonId : value.quizId) !== id ||
      value.language !== language ||
      value.version !== version
    )
      throw new Error("Content identity does not match the requested version.");
    return value;
  };
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) return validate(JSON.parse(cached));
  } catch {
    await AsyncStorage.removeItem(key).catch(() => {});
  }
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error("This content is not available yet.");
    const value = validate(await response.json());
    try {
      const keys = (await AsyncStorage.getAllKeys()).filter((k) =>
        k.startsWith(prefix),
      );
      if (keys.length >= 30)
        await AsyncStorage.multiRemove(keys.slice(0, keys.length - 29));
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Storage is an optimization; private browsing may disable it. */
    }
    return value;
  } finally {
    clearTimeout(timer);
  }
}
export function content(
  kind: "lessons",
  base: string,
  id: string,
  language: Language,
  version: number,
): Promise<LessonContent>;
export function content(
  kind: "quizzes",
  base: string,
  id: string,
  language: Language,
  version: number,
): Promise<QuizContent>;
export function content(
  kind: "lessons" | "quizzes",
  base: string,
  id: string,
  language: Language,
  version: number,
) {
  const key = contentUrl(base, kind, id, language, version);
  if (!inflight.has(key))
    inflight.set(
      key,
      fetchContent(kind, base, id, language, version).finally(() =>
        inflight.delete(key),
      ),
    );
  return inflight.get(key)!;
}
