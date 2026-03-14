import { evalThresholdCreateOrUpdateSchema } from "@repo/schema";
import { createZodDto } from "nestjs-zod";

export class EvalThresholdCreateOrUpdateDto extends createZodDto(evalThresholdCreateOrUpdateSchema){}
