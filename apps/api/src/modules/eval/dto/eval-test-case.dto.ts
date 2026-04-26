import { evalTestCaseCreateOrUpdateSchema, evalTestCaseFullCreateOrUpdateSchema } from "@repo/schema";
import { createZodDto } from "nestjs-zod";

export class EvalTestCaseCreateOrUpdateDto extends createZodDto(evalTestCaseCreateOrUpdateSchema){}
export class EvalTestCaseFullCreateOrUpdateDto extends createZodDto(evalTestCaseFullCreateOrUpdateSchema){}
