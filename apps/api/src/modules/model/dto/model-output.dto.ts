import { createZodDto } from "nestjs-zod";
import { modelOutputSchema } from "@repo/schema";

export class ModelOutputResponse extends createZodDto(modelOutputSchema){}
