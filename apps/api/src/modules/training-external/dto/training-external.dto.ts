import { createZodDto } from "nestjs-zod";
import {
  trainingCompleteRequestSchema,
  trainingProgressRequestSchema,
} from "../schema/training-external.schema";

export class TrainingProgressRequest extends createZodDto(trainingProgressRequestSchema){}
export class TrainingCompleteRequest extends createZodDto(trainingCompleteRequestSchema){}
