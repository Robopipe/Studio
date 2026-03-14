import { Module } from "@nestjs/common";
import { EvalTestCaseController } from "./controllers/eval-test-case.controller";
import { EvalLimitController } from "./controllers/eval-limit.controller";
import { EvalTestCaseService } from "./services/eval-test-case.service";
import { EvalLimitService } from "./services/eval-limit.service";
import { EvalThresholdService } from "./services/eval-threshold.service";
import { EvalThresholdController } from "./controllers/eval-threshold.controller";

@Module({
  providers: [EvalTestCaseService, EvalLimitService, EvalThresholdService],
  controllers: [EvalTestCaseController, EvalLimitController, EvalThresholdController]
})
export class EvalModule {}
