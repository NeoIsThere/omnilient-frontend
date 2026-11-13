import { z } from "zod";

export const LanguageSchema = z.enum(["en", "fr"]);
export type Language = z.infer<typeof LanguageSchema>;
export const IdSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/);
export const VersionSchema = z.number().int().positive();
export const ImageIdSchema = IdSchema;
const BlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), text: z.string().min(1) }).strict(),
  z.object({ type: z.literal("paragraph"), text: z.string().min(1) }).strict(),
  z
    .object({ type: z.literal("callout"), title: z.string(), text: z.string() })
    .strict(),
  z
    .object({
      type: z.literal("image"),
      imageId: ImageIdSchema,
      alt: z.string().trim().min(1).max(1000),
      caption: z.string().optional(),
    })
    .strict(),
]);
export const LessonContentSchema = z
  .object({
    schemaVersion: z.literal(1),
    lessonId: IdSchema,
    language: LanguageSchema,
    version: VersionSchema,
    title: z.string().min(1),
    summary: z.string(),
    minutes: z.number().int().positive(),
    blocks: z.array(BlockSchema).min(1),
    sources: z
      .array(
        z
          .object({
            title: z.string(),
            url: z
              .string()
              .url()
              .refine((v) => v.startsWith("https://")),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();
export type LessonContent = z.infer<typeof LessonContentSchema>;
export function imageObjectKey(imageId: string) {
  return `images/${ImageIdSchema.parse(imageId)}`;
}
export function imageUrl(base: string, imageId: string) {
  return `${base.replace(/\/$/, "")}/${imageObjectKey(imageId)}`;
}

const OrderSchema = z.number().int().min(0).max(2147483647);
const NameSchema = z.string().trim().min(1).max(200);
function translations<T extends { language: Language }>(schema: z.ZodType<T>) {
  return z
    .array(schema)
    .min(1)
    .max(2)
    .refine(
      (items) => new Set(items.map((t) => t.language)).size === items.length,
      "Duplicate translation language",
    );
}
const TopicNameSchema = z
  .object({ language: LanguageSchema, name: NameSchema })
  .strict();
export const CreateSubjectSchema = z
  .object({
    id: IdSchema.optional(),
    order: OrderSchema.default(0),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .default("#DDE6D2"),
    symbol: z.string().min(1).max(10).default("◉"),
    translations: translations(
      z
        .object({
          language: LanguageSchema,
          name: NameSchema,
          description: z.string().max(5000).default(""),
        })
        .strict(),
    ),
  })
  .strict();
export const CreateTopicSchema = z
  .object({
    id: IdSchema.optional(),
    subjectId: IdSchema,
    parentId: IdSchema.nullable().default(null),
    isLesson: z.boolean().default(false),
    order: OrderSchema.default(0),
    translations: translations(TopicNameSchema),
  })
  .strict();
export const EditTopicSchema = z
  .object({
    parentId: IdSchema.nullable().optional(),
    isLesson: z.boolean().optional(),
    order: OrderSchema.optional(),
    translations: translations(TopicNameSchema).optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one topic field to edit",
  );
const LessonDraftSchema = z
  .object({
    id: IdSchema.optional(),
    order: OrderSchema.default(0),
    publish: z.boolean().default(false),
    translations: translations(
      LessonContentSchema.omit({
        schemaVersion: true,
        lessonId: true,
        version: true,
      }).extend({
        title: z.string().trim().min(1).max(250),
        summary: z.string().max(10000),
        minutes: z.number().int().min(1).max(1440),
      }),
    ),
  })
  .strict();
const PublicQuestionSchema = z.discriminatedUnion("type", [
  z
    .object({
      id: IdSchema,
      type: z.literal("multiple-choice"),
      prompt: z.string(),
      options: z
        .array(z.object({ id: IdSchema, text: z.string() }).strict())
        .min(2),
    })
    .strict(),
  z
    .object({ id: IdSchema, type: z.literal("free-text"), prompt: z.string() })
    .strict(),
]);
// Strict objects deliberately reject answer keys anywhere in public quiz JSON.
export const QuizContentSchema = z
  .object({
    schemaVersion: z.literal(1),
    quizId: IdSchema,
    quizVersion: VersionSchema,
    language: LanguageSchema,
    version: VersionSchema,
    title: z.string(),
    questions: z.array(PublicQuestionSchema).min(1).max(100),
  })
  .strict()
  .superRefine((quiz, ctx) => {
    if (new Set(quiz.questions.map((q) => q.id)).size !== quiz.questions.length)
      ctx.addIssue({ code: "custom", message: "Duplicate question IDs" });
    for (const q of quiz.questions)
      if (
        q.type === "multiple-choice" &&
        new Set(q.options.map((o) => o.id)).size !== q.options.length
      )
        ctx.addIssue({ code: "custom", message: "Duplicate option IDs" });
  });
export type QuizContent = z.infer<typeof QuizContentSchema>;

const AuthorQuestionSchema = z.discriminatedUnion("type", [
  z.object({
    id: IdSchema,
    type: z.literal("multiple-choice"),
    prompt: z.string().trim().min(1).max(10000),
    options: z.array(z.object({ id: IdSchema, text: z.string().trim().min(1).max(4000) }).strict()).min(2).max(20),
    correctOptionId: IdSchema,
    explanation: z.string().trim().min(1).max(10000),
  }).strict(),
  z.object({
    id: IdSchema,
    type: z.literal("free-text"),
    prompt: z.string().trim().min(1).max(10000),
    acceptedAnswers: z.array(z.string().trim().min(1).max(2000)).min(1).max(50),
    explanation: z.string().trim().min(1).max(10000),
  }).strict(),
]);
export const QuizDraftSchema = z.object({
  id: IdSchema.optional(),
  translations: translations(z.object({
    language: LanguageSchema,
    title: z.string().trim().min(1).max(250),
    questions: z.array(AuthorQuestionSchema).min(1).max(100),
  }).strict()),
}).strict().superRefine((quiz, ctx) => {
  let canonical: string | undefined;
  for (const t of quiz.translations) {
    if (new Set(t.questions.map(q => q.id)).size !== t.questions.length)
      ctx.addIssue({ code: "custom", message: "Duplicate question IDs" });
    for (const q of t.questions) {
      if (q.type !== "multiple-choice") continue;
      const ids = q.options.map(o => o.id);
      if (new Set(ids).size !== ids.length)
        ctx.addIssue({ code: "custom", message: "Duplicate option IDs" });
      if (!ids.includes(q.correctOptionId))
        ctx.addIssue({ code: "custom", message: "Correct option must belong to the question" });
    }
    const shape = JSON.stringify(t.questions.map(q => ({
      id: q.id, type: q.type,
      options: q.type === "multiple-choice" ? q.options.map(o => o.id).sort() : [],
      correct: q.type === "multiple-choice" ? q.correctOptionId : null,
    })).sort((a, b) => a.id.localeCompare(b.id)));
    if (canonical !== undefined && canonical !== shape)
      ctx.addIssue({ code: "custom", message: "Translations must share question IDs, types, option IDs and correct option IDs" });
    canonical = shape;
  }
});
export type QuizDraft = z.infer<typeof QuizDraftSchema>;
export const CreateQuizSchema = QuizDraftSchema.safeExtend({ publish: z.boolean().default(false) });
export const CreateLessonSchema = LessonDraftSchema.extend({ quiz: QuizDraftSchema.optional() })
  .superRefine((lesson, ctx) => {
    if (lesson.quiz && lesson.translations.map(t => t.language).sort().join() !==
      lesson.quiz.translations.map(t => t.language).sort().join())
      ctx.addIssue({ code: "custom", message: "Bundled lesson and quiz must have the same translation languages" });
  });
export const SubmissionSchema = z
  .object({
    quizId: IdSchema,
    version: VersionSchema,
    language: LanguageSchema,
    contentVersion: VersionSchema,
    responses: z
      .array(
        z
          .object({ questionId: IdSchema, response: z.string().max(2000) })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict();
export type Submission = z.infer<typeof SubmissionSchema>;
export interface Correction {
  questionId: string;
  correct: boolean;
  answer: string;
  explanation: string;
}
export interface GradeResult {
  score: number;
  correctCount: number;
  total: number;
  corrections: Correction[];
}
export interface LessonMetadata {
  id: string;
  topicId: string;
  order: number;
  title: string;
  summary: string;
  minutes: number;
  language: Language;
  version: number;
}
export interface Topic {
  id: string;
  disciplineId: string;
  parentId: string | null;
  isLesson: boolean;
  name: string;
  order: number;
  lessons: LessonMetadata[];
}
export interface Discipline {
  id: string;
  name: string;
  description: string;
  color: string;
  symbol: string;
  topics: Topic[];
}
export interface Catalog {
  language: Language;
  cdnBaseUrl: string;
  disciplines: Discipline[];
}
export interface QuizMetadata {
  id: string;
  lessonId: string;
  quizVersion: number;
  language: Language;
  version: number;
  title: string;
}
export interface Progress {
  lessonId: string;
  completed: boolean;
  updatedAt: string;
}
export interface Attempt {
  id: string;
  quizId: string;
  quizVersion: number;
  contentVersion: number;
  language: Language;
  score: number;
  createdAt: string;
}
export function contentUrl(
  base: string,
  kind: "lessons" | "quizzes",
  id: string,
  language: Language,
  version: number,
) {
  IdSchema.parse(id);
  LanguageSchema.parse(language);
  VersionSchema.parse(version);
  return `${base.replace(/\/$/, "")}/${kind}/${id}/${language}/v${version}.json`;
}
