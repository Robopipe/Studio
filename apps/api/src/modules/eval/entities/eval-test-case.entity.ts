import { EvalLogicNode, EvalTestCase, EvalTestCaseDetail, EvalTestCaseFull, EvalSeverityEnum, EvalTestCaseThreshold, EvalTestCaseTypeEnum } from "@repo/schema";
import { EvalTestCaseDetailSelect, EvalTestCaseFullSelect, EvalTestCaseSelect, EvalTestCaseThresholdSelect } from "src/repository/types/eval";
import { EvalLimitDetailEntity, EvalLimitEntity } from "./eval-limit.entity";
import { EvalThresholdEntity } from "./eval-threshold.entity";

export class EvalTestCaseEntity {
  readonly id: string;
  readonly name: string;
  readonly type: EvalTestCaseTypeEnum;
  readonly limits: EvalLimitEntity[];
  readonly severity: EvalSeverityEnum | null;
  readonly enabled: boolean;
  readonly projectId: number;
  readonly dashboardConfigurationId: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;


  constructor(data: EvalTestCaseSelect){
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.limits = data.limits.map((limit) => new EvalLimitEntity(limit));
    this.severity = data.severity;
    this.enabled = data.enabled;
    this.projectId = data.projectId;
    this.dashboardConfigurationId = data.dashboardConfigurationId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  public toResponse(): EvalTestCase {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      severity: this.severity,
      enabled: this.enabled,
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


export class EvalTestCaseFullEntity extends EvalTestCaseDetailEntity {
  declare readonly limits: EvalLimitDetailEntity[];

  constructor(data: EvalTestCaseFullSelect){
    super(data)
    this.limits = data.limits.map((limit) => new EvalLimitDetailEntity(limit))
  }

  public toFullResponse(): EvalTestCaseFull {
    return {
      ...this.toDetailResponse(),
      limits: this.limits.map((limit) => limit.toDetailResponse())
    }
  }
}


export class EvalTestCaseThresholdEntity {
  readonly id: string;
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly thresholds: EvalThresholdEntity[]

  constructor(data: EvalTestCaseThresholdSelect){
    this.id = data.id;
    this.name = data.name;
    this.thresholds = data.thresholds.map((threshold) => new EvalThresholdEntity(threshold))
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt
  }

  public toResponse(): EvalTestCaseThreshold {
    return {
      id: this.id,
      name: this.name,
      thresholds: this.thresholds.map((threshold) => threshold.toResponse()),
      updatedAt: this.updatedAt.toISOString(),
      createdAt: this.createdAt.toISOString()
    }
  }
}
