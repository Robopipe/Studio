import { createZodDto } from "nestjs-zod";
import {
  confidenceReportCompleteSchema,
  confidenceReportErrorSchema,
  confidenceReportProgressSchema,
  runConfidenceReportSchema,
} from "@repo/schema";

export class RunConfidenceReportDto extends createZodDto(runConfidenceReportSchema) {}
export class ConfidenceReportProgressDto extends createZodDto(confidenceReportProgressSchema) {}
export class ConfidenceReportCompleteDto extends createZodDto(confidenceReportCompleteSchema) {}
export class ConfidenceReportErrorDto extends createZodDto(confidenceReportErrorSchema) {}
