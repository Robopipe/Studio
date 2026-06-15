import { EvalLimitItem, EvalLimitItemEdgeEnum, EvalLimitItemOperatorEnum, EvalLimitItemParameterEnum, EvalLimitItemQuantifierTypeEnum, EvalLimitItemQuantifierUnitEnum } from "@repo/schema";
import { EvalLimitItemSelect } from "src/repository/types/eval";

export class EvalLimitItemEntity {
  readonly id: string;
  readonly limitFrom: number | null;
  readonly limitTo: number | null;
  readonly parameter: EvalLimitItemParameterEnum;
  readonly operator: EvalLimitItemOperatorEnum;
  readonly quantifierType: EvalLimitItemQuantifierTypeEnum;
  readonly quantifierUnit: EvalLimitItemQuantifierUnitEnum;
  readonly quantifierValue: number;
  readonly targetEdge: EvalLimitItemEdgeEnum;
  readonly parentEdge: EvalLimitItemEdgeEnum;
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
    this.quantifierType = data.quantifierType;
    this.quantifierUnit = data.quantifierUnit;
    this.quantifierValue = data.quantifierValue;
    this.targetEdge = data.targetEdge;
    this.parentEdge = data.parentEdge;
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
      quantifierType: this.quantifierType,
      quantifierUnit: this.quantifierUnit,
      quantifierValue: this.quantifierValue,
      targetEdge: this.targetEdge,
      parentEdge: this.parentEdge,
      updatedAt: this.updatedAt.toISOString(),
      createdAt: this.createdAt.toISOString()
    }
  }
}
