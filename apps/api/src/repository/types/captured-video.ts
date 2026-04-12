import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { capturedVideoTable } from "@repo/database";

export type CapturedVideoSelect = InferSelectModel<typeof capturedVideoTable>;
export type CapturedVideoInsert = InferInsertModel<typeof capturedVideoTable>;
