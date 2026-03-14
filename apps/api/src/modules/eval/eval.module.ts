import { Module } from "@nestjs/common";
import { EvalTestCaseController } from "./controllers/eval-test-case.controller";
import { EvalLimitController } from "./controllers/eval-limit.controller";
import { EvalTestCaseService } from "./services/eval-test-case.service";
import { EvalLimitService } from "./services/eval-limit.service";

@Module({
  providers: [EvalTestCaseService, EvalLimitService],
  controllers: [EvalTestCaseController, EvalLimitController]
})
export class EvalModule {}
