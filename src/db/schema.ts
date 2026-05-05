import {
  pgTable,
  uuid,
  text,
  smallint,
  integer,
  inet,
  jsonb,
  timestamp,
  char,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

const timestamps = {
  createdAt: timestamptz("created_at").notNull().default(sql`now()`),
};

// ── Projects ────────────────────────────────────────────────────────────────
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  ...timestamps,
  updatedAt: timestamptz("updated_at").notNull().default(sql`now()`),
});

// ── Questions ────────────────────────────────────────────────────────────────
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull(),
  text: text("text").notNull(),
  hint: text("hint"),
});

// ── Question Options ─────────────────────────────────────────────────────────
export const questionOptions = pgTable("question_options", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  letter: char("letter", { length: 1 }).notNull(),
  text: text("text").notNull(),
  score: smallint("score").notNull(),
  orderIndex: integer("order_index").notNull(),
});

// ── Result Profiles ──────────────────────────────────────────────────────────
export const resultProfiles = pgTable("result_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  scoreMin: smallint("score_min").notNull(),
  scoreMax: smallint("score_max").notNull(),
  name: text("name").notNull(),
  badge: text("badge").notNull(),
  headline: text("headline").notNull(),
  ctaText: text("cta_text").notNull(),
  ctaUrl: text("cta_url").notNull(),
});

// ── Result Profile Blocks ────────────────────────────────────────────────────
export const resultProfileBlocks = pgTable("result_profile_blocks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => resultProfiles.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull(),
  content: text("content").notNull(),
});

// ── Leads ────────────────────────────────────────────────────────────────────
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => resultProfiles.id),
    name: text("name").notNull(),
    email: text("email").notNull(),
    score: smallint("score").notNull(),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (t) => [
    index("leads_project_created_idx").on(t.projectId, t.createdAt),
    index("leads_email_project_idx").on(t.email, t.projectId),
  ]
);

// ── Lead Answers ─────────────────────────────────────────────────────────────
export const leadAnswers = pgTable("lead_answers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id),
  optionId: uuid("option_id")
    .notNull()
    .references(() => questionOptions.id),
});

// ── Analytics Events ─────────────────────────────────────────────────────────
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    sessionId: text("session_id").notNull(),
    eventType: text("event_type").notNull(),
    metadata: jsonb("metadata"),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (t) => [
    index("events_project_type_created_idx").on(
      t.projectId,
      t.eventType,
      t.createdAt
    ),
    index("events_session_idx").on(t.sessionId),
  ]
);

// ── Users (admin) ────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  ...timestamps,
});

// ── Types ────────────────────────────────────────────────────────────────────
export type Project = typeof projects.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type QuestionOption = typeof questionOptions.$inferSelect;
export type ResultProfile = typeof resultProfiles.$inferSelect;
export type ResultProfileBlock = typeof resultProfileBlocks.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type LeadAnswer = typeof leadAnswers.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type User = typeof users.$inferSelect;

export type EventType =
  | "page_view"
  | "quiz_start"
  | "question_answer"
  | "quiz_complete"
  | "lead_capture"
  | "result_view"
  | "cta_click";
