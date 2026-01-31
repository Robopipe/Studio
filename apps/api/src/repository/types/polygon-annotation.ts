import { InferSelectModel } from "drizzle-orm";
import { polygonAnnotationTable } from "@repo/database";
import { ProjectLabelSelect } from "./project-label";

export type PolygonAnnotationSelect = InferSelectModel<typeof polygonAnnotationTable> & {label: ProjectLabelSelect}
