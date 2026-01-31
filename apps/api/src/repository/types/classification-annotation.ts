import { InferSelectModel } from "drizzle-orm";
import { classificationAnnotationTable } from "@repo/database";
import { ProjectLabelSelect } from "./project-label";

export type ClassificationAnnotationSelect = InferSelectModel<typeof classificationAnnotationTable> & {label: ProjectLabelSelect}
