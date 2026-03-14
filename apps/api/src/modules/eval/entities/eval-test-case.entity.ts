import { EvalLogicNode, EvalTestCase, EvalTestCaseDetail, EvalTestCaseSeverityEnum, EvalTestCaseTypeEnum } from "@repo/schema";
import { EvalTestCaseDetailSelect, EvalTestCaseSelect } from "src/repository/types/eval";
import { EvalLimitEntity } from "./eval-limit.entity";

export class EvalTestCaseEntity {
  readonly id: string;
  readonly name: string;
  readonly type: EvalTestCaseTypeEnum;
  readonly limits: EvalLimitEntity[];
  readonly severity: EvalTestCaseSeverityEnum;
  readonly projectId: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;


  constructor(data: EvalTestCaseSelect){
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.limits = data.limits.map((limit) => new EvalLimitEntity(limit));
    this.severity = data.severity;
    this.projectId = data.projectId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  public toResponse(): EvalTestCase {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      severity: this.severity,
      limits: this.limits.map((limit) => limit.toResponse()),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    }
  }
}

export class EvalTestCaseDetailEntity extends EvalTestCaseEntity {
  readonly logicNodes: EvalLogicNode[]

  constructor(data: EvalTestCaseDetailSelect){
    super(data)
    this.logicNodes = data.logicNodes
  }

  public toDetailResponse(): EvalTestCaseDetail {
    return {
      ...this.toResponse(),
      logicNodes: this.logicNodes
    }
  }
}
