import { createZodDto } from "nestjs-zod";
import {
  updateOrganizationRequestSchema,
  organizationSchema,
  organizationMembersResponseSchema,
  updateMemberRoleSchema,
} from "@repo/schema";

export class OrganizationUpdateRequest extends createZodDto(updateOrganizationRequestSchema){}
export class OrganizationResponse extends createZodDto(organizationSchema){}
export class OrganizationMembersResponse extends createZodDto(organizationMembersResponseSchema){}
export class UpdateMemberRoleDto extends createZodDto(updateMemberRoleSchema){}
