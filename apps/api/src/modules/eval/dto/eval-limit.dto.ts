import { evalLimitCreateOrUpdateSchema } from "@repo/schema";
import { createZodDto } from "nestjs-zod";

export class EvalLimitCreateOrUpdateDto extends createZodDto(evalLimitCreateOrUpdateSchema){}
