import * as p from "drizzle-orm/pg-core";
import { id } from "../helpers";
import { confidenceReportTable, confidenceReportGtGeometryEnum } from "./confidence-report";
import { taskTable } from "./task";
import { projectLabelTable } from "./project-label";

export const confidenceReportRegionTable = p.pgTable(
  "confidence_report_region",
  {
    id,
    reportId: p
      .integer("report_id")
      .references(() => confidenceReportTable.id, { onDelete: "cascade" })
      .notNull(),
    taskId: p
      .integer("task_id")
      .references(() => taskTable.id, { onDelete: "cascade" })
      .notNull(),
    labelId: p
      .integer("label_id")
      .references(() => projectLabelTable.id, { onDelete: "cascade" })
      .notNull(),
    /** Geometry type — always matches the report's gtGeometry. */
    geometry: confidenceReportGtGeometryEnum("geometry").notNull(),
    /** Confidence score output by the model (0–1). */
    score: p.real("score").notNull(),
    /** Matched IoU against the ground-truth annotation (TP only; null for false positives). */
    iou: p.real("iou"),
    /** ID of the ground-truth annotation (rectangle_annotation or polygon_annotation) this
     *  prediction was matched to at IoU≥0.5. Null for false positives. Plain int — not a
     *  foreign key because GT lives in two separate tables. */
    matchedAnnotationId: p.integer("matched_annotation_id"),
    /** Rectangle geometry — percentage coords (0–100), null for polygons. */
    x: p.doublePrecision("x"),
    y: p.doublePrecision("y"),
    width: p.doublePrecision("width"),
    height: p.doublePrecision("height"),
    /** Polygon geometry — percentage coords (0–100), null for rectangles. */
    value: p.point({ mode: "tuple" }).array(),
  },
  (t) => [
    p.index("confidence_report_region_report_id_idx").on(t.reportId),
    p.index("confidence_report_region_task_id_idx").on(t.taskId),
  ],
);
