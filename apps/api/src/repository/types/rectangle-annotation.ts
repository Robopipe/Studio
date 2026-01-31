import { InferSelectModel } from "drizzle-orm";
import { rectangleAnnotationTable } from "@repo/database";
import { ProjectLabelSelect } from "./project-label";

export type RectangleAnnotationSelect = InferSelectModel<typeof rectangleAnnotationTable> & {label: ProjectLabelSelect}
