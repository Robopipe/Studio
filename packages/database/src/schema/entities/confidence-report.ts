import * as p from "drizzle-orm/pg-core";
import { id, timestamps } from "../helpers";
import { modelTable } from "./model";
import { projectTable } from "./project";
import {
  ConfidenceReportGtGeometryEnum,
  ConfidenceReportStatusEnum,
} from "@repo/schema";

export const confidenceReportStatusEnum = p.pgEnum(
  "confidence_report_status_enum",
  [
    ConfidenceReportStatusEnum.PENDING,
    ConfidenceReportStatusEnum.RUNNING,
    ConfidenceReportStatusEnum.DONE,
    ConfidenceReportStatusEnum.ERROR,
    ConfidenceReportStatusEnum.CANCELLED,
  ],
);

export const confidenceReportGtGeometryEnum = p.pgEnum(
  "confidence_report_gt_geometry_enum",
  [
    ConfidenceReportGtGeometryEnum.RECTANGLE,
    ConfidenceReportGtGeometryEnum.POLYGON,
  ],
);

export const confidenceReportTable = p.pgTable("confidence_report", {
  id,
  projectId: p
    .integer("project_id")
    .references(() => projectTable.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  modelId: p
    .integer("model_id")
    .references(() => modelTable.id, { onDelete: "set null" }),
  conf: p.real("conf").notNull(),
  /** IoU threshold at which a prediction counts as a true-positive match against GT. */
  matchIou: p.real("match_iou").notNull().default(0.5),
  gtGeometry: confidenceReportGtGeometryEnum("gt_geometry").notNull(),
  status: confidenceReportStatusEnum("status").notNull(),
  /** Number of tasks fully processed so far. */
  processed: p.integer("processed").notNull().default(0),
  /** Total tasks in the project when the run was started. */
  total: p.integer("total").notNull().default(0),
  /** Cloud Run Job execution resource name — used to cancel the run. */
  executionName: p.text("execution_name"),
  errorMessage: p.text("error_message"),
  /**
   * Frozen per-class box-stats for the confidence and IoU box-plots.
   * Written by the final complete webhook.
   * Shape: ConfidenceReportPerClassStats[]
   */
  perClassStats: p.jsonb("per_class_stats"),
  /**
   * Dataset-level micro precision: ΣTP/(ΣTP+ΣFP) across all tasks in the run.
   * Written by the final complete webhook. Null when no predictions in the run.
   */
  overallPrecision: p.real("overall_precision"),
  /**
   * Dataset-level micro recall: ΣTP/(ΣTP+ΣFN) across all tasks in the run.
   * Written by the final complete webhook. Null when no GT in the run.
   */
  overallRecall: p.real("overall_recall"),
  ...timestamps,
});
