import { Inject, Injectable } from "@nestjs/common";
import {
  classificationAnnotationTable,
  polygonAnnotationTable,
  projectLabelTable,
  rectangleAnnotationTable,
  taskTable,
} from "@repo/database/schema";
import type { AnnotationType } from "@repo/schema";
import { sql, type SQL } from "drizzle-orm";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";

export interface LabelStatRow {
  labelId: number;
  name: string;
  color: string;
  instanceCount: number;
  minArea: number | null;
  q1: number | null;
  median: number | null;
  q3: number | null;
  maxArea: number | null;
  whiskerLow: number | null;
  whiskerHigh: number | null;
  outliers: number[];
  outlierCount: number;
}

export interface TypePresenceRow {
  hasRectangle: boolean;
  hasPolygon: boolean;
  hasClassification: boolean;
}

export interface SuggestionLabelStatRow {
  labelId: number;
  name: string;
  color: string;
  instanceCount: number;
  /** Distinct images containing at least one instance of this label */
  imageCount: number;
  minArea: number | null;
  q1: number | null;
  median: number | null;
  q3: number | null;
  maxArea: number | null;
}

export interface SuggestionDatasetStats {
  labels: SuggestionLabelStatRow[];
  /** DONE, non-deleted tasks in scope (selected taskIds or whole project) */
  totalTasks: number;
  /** Distinct in-scope tasks with at least one relevant annotation */
  labeledTasks: number;
}

export interface ResolutionStatRow {
  width: number;
  height: number;
  count: number;
}

@Injectable()
export class AnalyticsRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  public async getDatasetStats(
    projectId: number,
    types: AnnotationType[],
  ): Promise<{ labels: LabelStatRow[]; presence: TypePresenceRow }> {
    const includeRect = types.includes("rectangle");
    const includePoly = types.includes("polygon");
    const includeClass = types.includes("classification");

    const geomUnion = this.buildGeomUnion({ includeRect, includePoly });
    const instanceUnion = this.buildInstanceUnion({
      includeRect,
      includePoly,
      includeClass,
    });
    const query = this.buildQuery(projectId, geomUnion, instanceUnion);

    const result = await this.db.execute(query);
    const rows = result.rows as Record<string, unknown>[];

    if (rows.length === 0) {
      return {
        labels: [],
        presence: {
          hasRectangle: false,
          hasPolygon: false,
          hasClassification: false,
        },
      };
    }

    return this.mapRows(rows);
  }

  /**
   * Dataset stats for the AI hyperparameter suggestion: like getDatasetStats
   * but scoped to DONE tasks (optionally a taskIds subset), with per-label
   * distinct-image counts and dataset totals, without outlier arrays.
   */
  public async getSuggestionDatasetStats(
    projectId: number,
    opts: { taskIds: number[]; types: AnnotationType[] },
  ): Promise<SuggestionDatasetStats> {
    const includeRect = opts.types.includes("rectangle");
    const includePoly = opts.types.includes("polygon");
    const includeClass = opts.types.includes("classification");

    const geomUnion = this.buildGeomUnion({ includeRect, includePoly });
    const instanceUnion = this.buildInstanceUnion({
      includeRect,
      includePoly,
      includeClass,
    });
    const taskScope = this.buildTaskScope(opts.taskIds);

    const query = sql`
      WITH
      project_tasks AS (
        SELECT id, width, height
        FROM ${taskTable}
        WHERE project_id = ${projectId}
          AND deleted_at IS NULL
          AND status = 'DONE'
          AND width > 0 AND height > 0
          ${taskScope}
      ),
      all_geom_areas AS (
        ${geomUnion}
      ),
      geom_stats AS (
        SELECT
          label_id,
          MIN(area)                                              AS min_area,
          percentile_cont(0.25) WITHIN GROUP (ORDER BY area)    AS q1,
          percentile_cont(0.5)  WITHIN GROUP (ORDER BY area)    AS median,
          percentile_cont(0.75) WITHIN GROUP (ORDER BY area)    AS q3,
          MAX(area)                                             AS max_area
        FROM all_geom_areas
        GROUP BY label_id
      ),
      all_instances AS (
        ${instanceUnion}
      ),
      instance_counts AS (
        SELECT label_id, COUNT(*) AS cnt, COUNT(DISTINCT task_id) AS image_cnt
        FROM all_instances
        GROUP BY label_id
      ),
      totals AS (
        SELECT
          (SELECT COUNT(*) FROM project_tasks)                       AS total_tasks,
          (SELECT COUNT(DISTINCT task_id) FROM all_instances)        AS labeled_tasks
      )
      SELECT
        pl.id                        AS label_id,
        pl.name,
        pl.color,
        COALESCE(ic.cnt, 0)          AS instance_count,
        COALESCE(ic.image_cnt, 0)    AS image_count,
        gs.min_area,
        gs.q1,
        gs.median,
        gs.q3,
        gs.max_area,
        t.total_tasks,
        t.labeled_tasks
      FROM ${projectLabelTable} pl
      CROSS JOIN totals t
      LEFT JOIN instance_counts ic ON ic.label_id = pl.id
      LEFT JOIN geom_stats      gs ON gs.label_id = pl.id
      WHERE pl.project_id = ${projectId}
        AND pl.deleted_at IS NULL
      ORDER BY COALESCE(ic.cnt, 0) DESC, pl.id ASC
    `;

    const result = await this.db.execute(query);
    const rows = result.rows as Record<string, unknown>[];

    const labels: SuggestionLabelStatRow[] = rows.map((r) => ({
      labelId: Number(r.label_id),
      name: String(r.name),
      color: String(r.color),
      instanceCount: Number(r.instance_count),
      imageCount: Number(r.image_count),
      minArea: r.min_area != null ? Number(r.min_area) : null,
      q1: r.q1 != null ? Number(r.q1) : null,
      median: r.median != null ? Number(r.median) : null,
      q3: r.q3 != null ? Number(r.q3) : null,
      maxArea: r.max_area != null ? Number(r.max_area) : null,
    }));

    return {
      labels,
      totalTasks: rows.length > 0 ? Number(rows[0].total_tasks) : 0,
      labeledTasks: rows.length > 0 ? Number(rows[0].labeled_tasks) : 0,
    };
  }

  /**
   * Most common image resolutions among DONE tasks in scope (top 10 by count).
   */
  public async getResolutionStats(
    projectId: number,
    taskIds: number[],
  ): Promise<ResolutionStatRow[]> {
    const taskScope = this.buildTaskScope(taskIds);
    const result = await this.db.execute(sql`
      SELECT width, height, COUNT(*) AS cnt
      FROM ${taskTable}
      WHERE project_id = ${projectId}
        AND deleted_at IS NULL
        AND status = 'DONE'
        AND width > 0 AND height > 0
        ${taskScope}
      GROUP BY width, height
      ORDER BY cnt DESC, width DESC
      LIMIT 10
    `);
    return (result.rows as Record<string, unknown>[]).map((r) => ({
      width: Number(r.width),
      height: Number(r.height),
      count: Number(r.cnt),
    }));
  }

  private buildTaskScope(taskIds: number[]): SQL {
    if (taskIds.length === 0) return sql``;
    return sql`AND id IN (${sql.join(
      taskIds.map((id) => sql`${id}`),
      sql`, `,
    )})`;
  }

  // ---------------------------------------------------------------------------

  private buildGeomUnion(types: {
    includeRect: boolean;
    includePoly: boolean;
  }): SQL {
    const parts: SQL[] = [];

    if (types.includeRect) {
      parts.push(sql`
        SELECT ra.label_id, (ra.width * ra.height) / (t.width::float8 * t.height) AS area
        FROM ${rectangleAnnotationTable} ra
        JOIN project_tasks t ON t.id = ra.task_id
      `);
    }

    if (types.includePoly) {
      parts.push(sql`
        SELECT pa.label_id,
          ABS((
            SELECT SUM(
              (pa.value[i])[0]::float8 * (pa.value[(i % array_length(pa.value, 1)) + 1])[1]::float8
              - (pa.value[(i % array_length(pa.value, 1)) + 1])[0]::float8 * (pa.value[i])[1]::float8
            )
            FROM generate_series(1, array_length(pa.value, 1)) AS i
          )) / 2.0 / (t.width::float8 * t.height) AS area
        FROM ${polygonAnnotationTable} pa
        JOIN project_tasks t ON t.id = pa.task_id
        WHERE array_length(pa.value, 1) >= 3
      `);
    }

    return parts.length > 0
      ? sql.join(parts, sql` UNION ALL `)
      : sql`SELECT NULL::integer AS label_id, NULL::float8 AS area WHERE FALSE`;
  }

  private buildInstanceUnion(types: {
    includeRect: boolean;
    includePoly: boolean;
    includeClass: boolean;
  }): SQL {
    const parts: SQL[] = [];

    if (types.includeRect) {
      parts.push(sql`
        SELECT ra.label_id, ra.task_id FROM ${rectangleAnnotationTable} ra JOIN project_tasks t ON t.id = ra.task_id
      `);
    }
    if (types.includePoly) {
      parts.push(sql`
        SELECT pa.label_id, pa.task_id FROM ${polygonAnnotationTable} pa JOIN project_tasks t ON t.id = pa.task_id
      `);
    }
    if (types.includeClass) {
      parts.push(sql`
        SELECT ca.label_id, ca.task_id FROM ${classificationAnnotationTable} ca JOIN project_tasks t ON t.id = ca.task_id
      `);
    }

    return parts.length > 0
      ? sql.join(parts, sql` UNION ALL `)
      : sql`SELECT NULL::integer AS label_id, NULL::integer AS task_id WHERE FALSE`;
  }

  private buildQuery(
    projectId: number,
    geomUnion: SQL,
    instanceUnion: SQL,
  ): SQL {
    return sql`
      WITH
      project_tasks AS (
        SELECT id, width, height
        FROM ${taskTable}
        WHERE project_id = ${projectId}
          AND deleted_at IS NULL
          AND width > 0 AND height > 0
      ),
      all_geom_areas AS (
        ${geomUnion}
      ),
      geom_stats AS (
        SELECT
          label_id,
          MIN(area)                                              AS min_area,
          percentile_cont(0.25) WITHIN GROUP (ORDER BY area)    AS q1,
          percentile_cont(0.5)  WITHIN GROUP (ORDER BY area)    AS median,
          percentile_cont(0.75) WITHIN GROUP (ORDER BY area)    AS q3,
          MAX(area)                                             AS max_area
        FROM all_geom_areas
        GROUP BY label_id
      ),
      whisker_stats AS (
        SELECT
          label_id, min_area, q1, median, q3, max_area,
          GREATEST(min_area, q1 - 1.5 * (q3 - q1)) AS whisker_low,
          LEAST(max_area,    q3 + 1.5 * (q3 - q1)) AS whisker_high
        FROM geom_stats
      ),
      outlier_raw AS (
        SELECT
          a.label_id,
          a.area,
          ROW_NUMBER() OVER (PARTITION BY a.label_id ORDER BY a.area)      AS rn_asc,
          ROW_NUMBER() OVER (PARTITION BY a.label_id ORDER BY a.area DESC) AS rn_desc,
          COUNT(*)     OVER (PARTITION BY a.label_id)                      AS total_outlier_count
        FROM all_geom_areas a
        JOIN whisker_stats w ON w.label_id = a.label_id
        WHERE a.area < w.whisker_low OR a.area > w.whisker_high
      ),
      outliers_agg AS (
        SELECT
          label_id,
          MAX(total_outlier_count)                                                          AS outlier_count,
          array_agg(area ORDER BY area) FILTER (WHERE rn_asc <= 25 OR rn_desc <= 25)       AS outlier_values
        FROM outlier_raw
        GROUP BY label_id
      ),
      instance_counts AS (
        SELECT label_id, COUNT(*) AS cnt
        FROM (${instanceUnion}) AS instances
        GROUP BY label_id
      ),
      type_presence AS (
        SELECT
          (SELECT COUNT(*) > 0
             FROM ${rectangleAnnotationTable} ra
             JOIN project_tasks t ON t.id = ra.task_id)      AS has_rectangle,
          (SELECT COUNT(*) > 0
             FROM ${polygonAnnotationTable} pa
             JOIN project_tasks t ON t.id = pa.task_id)      AS has_polygon,
          (SELECT COUNT(*) > 0
             FROM ${classificationAnnotationTable} ca
             JOIN project_tasks t ON t.id = ca.task_id)      AS has_classification
      )
      SELECT
        pl.id                                              AS label_id,
        pl.name,
        pl.color,
        COALESCE(ic.cnt, 0)                               AS instance_count,
        ws.min_area,
        ws.q1,
        ws.median,
        ws.q3,
        ws.max_area,
        ws.whisker_low,
        ws.whisker_high,
        COALESCE(oa.outlier_values, '{}'::float8[])       AS outliers,
        COALESCE(oa.outlier_count,  0)                    AS outlier_count,
        tp.has_rectangle,
        tp.has_polygon,
        tp.has_classification
      FROM ${projectLabelTable} pl
      CROSS JOIN type_presence tp
      LEFT JOIN instance_counts ic ON ic.label_id = pl.id
      LEFT JOIN whisker_stats   ws ON ws.label_id  = pl.id
      LEFT JOIN outliers_agg    oa ON oa.label_id  = pl.id
      WHERE pl.project_id = ${projectId}
        AND pl.deleted_at IS NULL
      ORDER BY COALESCE(ic.cnt, 0) DESC, pl.id ASC
    `;
  }

  private mapRows(rows: Record<string, unknown>[]): {
    labels: LabelStatRow[];
    presence: TypePresenceRow;
  } {
    const first = rows[0];
    const presence: TypePresenceRow = {
      hasRectangle: Boolean(first.has_rectangle),
      hasPolygon: Boolean(first.has_polygon),
      hasClassification: Boolean(first.has_classification),
    };

    const labels: LabelStatRow[] = rows.map((r) => ({
      labelId: Number(r.label_id),
      name: String(r.name),
      color: String(r.color),
      instanceCount: Number(r.instance_count),
      minArea: r.min_area != null ? Number(r.min_area) : null,
      q1: r.q1 != null ? Number(r.q1) : null,
      median: r.median != null ? Number(r.median) : null,
      q3: r.q3 != null ? Number(r.q3) : null,
      maxArea: r.max_area != null ? Number(r.max_area) : null,
      whiskerLow: r.whisker_low != null ? Number(r.whisker_low) : null,
      whiskerHigh: r.whisker_high != null ? Number(r.whisker_high) : null,
      outliers: Array.isArray(r.outliers)
        ? (r.outliers as unknown[]).map(Number)
        : [],
      outlierCount: Number(r.outlier_count ?? 0),
    }));

    return { labels, presence };
  }
}
