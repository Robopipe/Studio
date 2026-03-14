import { EvalLimitItem, EvalLimitItemOperatorEnum, EvalLimitItemParameterEnum } from "@repo/schema";
import { EvalLimitItemSelect } from "src/repository/types/eval";

export class EvalLimitItemEntity {
  readonly id: string;
  readonly limitFrom: number | null;
  readonly limitTo: number | null;
  readonly parameter: EvalLimitItemParameterEnum;
  readonly operator: EvalLimitItemOperatorEnum;
  readonly limitId: string;
  readonly position: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    data: EvalLimitItemSelect
  ){
    this.id = data.id;
    this.limitFrom = data.limitFrom;
    this.limitTo = data.limitTo;
    this.parameter = data.parameter;
    this.operator = data.operator;
    this.position = data.position;
    this.limitId = data.limitId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  public toResponse(): EvalLimitItem {
    return {
      id: this.id,
      limitFrom: this.limitFrom,
      limitTo: this.limitTo,
      parameter: this.parameter,
      operator: this.operator,
      updatedAt: this.updatedAt.toISOString(),
      createdAt: this.createdAt.toISOString()
    }
  }
}
