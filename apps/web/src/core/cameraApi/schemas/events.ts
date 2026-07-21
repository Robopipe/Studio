import z from "zod";

export const violatedLimitSchema = z.object({
  limit_id: z.string(),
  limit_name: z.string(),
  display_id: z.number().int().nullish(),
  parent_display_id: z.number().int().nullish(),
});
export type ViolatedLimit = z.infer<typeof violatedLimitSchema>;

export const eventListItemSchema = z.object({
  id: z.number().int(),
  session_id: z.number().int(),
  session_start: z.string(),
  session_end: z.string().nullable(),
  // Studio model id the event's session ran with; null for legacy sessions.
  model_id: z.number().int().nullable(),
  timestamp: z.string(),
  test_case_id: z.string(),
  test_case_name: z.string(),
  passed: z.boolean(),
  has_picture: z.boolean(),
  violated_limits: z.array(violatedLimitSchema),
});
export type EventListItem = z.infer<typeof eventListItemSchema>;

export const eventListResponseSchema = z.object({
  items: z.array(eventListItemSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});
export type EventListResponse = z.infer<typeof eventListResponseSchema>;

export const eventDetectionSchema = z.object({
  label_id: z.number().int(),
  label_name: z.string(),
  confidence: z.number(),
  // Coordinates are normalized to 0-1 relative to the event picture.
  x_min: z.number(),
  y_min: z.number(),
  x_max: z.number(),
  y_max: z.number(),
  display_id: z.number().int().nullish(),
  parent_display_id: z.number().int().nullish(),
  role: z.string().nullish(),
});
export type EventDetection = z.infer<typeof eventDetectionSchema>;

export const eventDetailSchema = eventListItemSchema.extend({
  detections: z.array(eventDetectionSchema),
});
export type EventDetail = z.infer<typeof eventDetailSchema>;

export const sessionSummarySchema = z.object({
  id: z.number().int(),
  start_time: z.string(),
  end_time: z.string().nullable(),
  end_reason: z.string().nullish(),
  event_count: z.number().int(),
  failed_count: z.number().int(),
});
export type SessionSummary = z.infer<typeof sessionSummarySchema>;

export const eventSortBySchema = z.enum([
  "timestamp",
  "session_start",
  "test_case_name",
  "passed",
]);
export type EventSortBy = z.infer<typeof eventSortBySchema>;

export const sortOrderSchema = z.enum(["asc", "desc"]);
export type SortOrder = z.infer<typeof sortOrderSchema>;
