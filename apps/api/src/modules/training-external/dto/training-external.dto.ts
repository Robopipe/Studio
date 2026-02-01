import { createZodDto } from "nestjs-zod";
import { trainingProgressRequestSchema } from "../schema/training-external.schema";

export class TrainingProgressRequest extends createZodDto(trainingProgressRequestSchema){}
