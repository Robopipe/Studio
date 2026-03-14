import { evalTestCaseCreateOrUpdateSchema } from "@repo/schema";
import { createZodDto } from "nestjs-zod";

export class EvalTestCaseCreateOrUpdateDto extends createZodDto(evalTestCaseCreateOrUpdateSchema){}
