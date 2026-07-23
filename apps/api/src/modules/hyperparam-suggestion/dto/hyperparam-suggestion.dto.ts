import {
  suggestHyperparamsRequestSchema,
  suggestHyperparamsResponseSchema,
} from "@repo/schema";
import { createZodDto } from "nestjs-zod";

export class SuggestHyperparamsRequestDto extends createZodDto(
  suggestHyperparamsRequestSchema,
) {}
export class SuggestHyperparamsResponseDto extends createZodDto(
  suggestHyperparamsResponseSchema,
) {}
