import { ModelAugmentationTypeEnum } from "@repo/schema";
import * as p from "drizzle-orm/pg-core";
import { id } from "../helpers";
import { modelTable } from "./model";

export const modelAugmentationTypeEnum = p.pgEnum(
  "model_augmentation_type_enum",
  ModelAugmentationTypeEnum,
);

export const modelAugmentationTable = p.pgTable("model_augmentation", {
  id,
  modelId: p
    .integer("model_id")
    .references(() => modelTable.id, { onDelete: "cascade" })
    .notNull(),
  type: modelAugmentationTypeEnum("type").notNull(),
  params: p.jsonb("parameters").notNull().default("{}").$type<Record<string, unknown>>(),
});
