import * as p from 'drizzle-orm/pg-core'
import { id, timestamps } from '../helpers'
import { organizationTable } from './organization'
import { ProjectTypeEnum } from "@repo/schema";

export const projectTypeEnum = p.pgEnum("project_type_enum", [ProjectTypeEnum.CLASSIFICATION, ProjectTypeEnum.DETECTION, ProjectTypeEnum.SEGMENTATION])

export const projectTable = p.pgTable("project", {
  id,
  name: p.varchar("name", {length:256}).notNull(),
  description: p.text("description").notNull(),
  type: projectTypeEnum("type").notNull(),
  cameraApiUrl: p.text("camera_api_url"),
  organizationId: p.integer("organization_id").references(() => organizationTable.id, {onDelete: 'cascade'}).notNull(),
  ...timestamps
})
