import { createZodDto } from "nestjs-zod";
import {
  updateOrganizationRequestSchema,
  organizationSchema,
  organizationMembersResponseSchema,
} from "@repo/schema";

export class OrganizationUpdateRequest extends createZodDto(updateOrganizationRequestSchema){}
export class OrganizationResponse extends createZodDto(organizationSchema){}
export class OrganizationMembersResponse extends createZodDto(organizationMembersResponseSchema){}
