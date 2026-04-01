import { modelAugmentationTypeEnum } from "./model-augmentation";
import * as p from "drizzle-orm/pg-core";
import { id } from "../helpers";
import { modelTable } from "./model";

export const modelPreprocessingTable = p.pgTable("model_preprocessing", {
  id,
  modelId: p
    .integer("model_id")
    .references(() => modelTable.id, { onDelete: "cascade" })
    .notNull(),
  type: modelAugmentationTypeEnum("type").notNull(),
  params: p.jsonb("parameters").notNull().default("{}").$type<Record<string, unknown>>(),
});
