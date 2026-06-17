import {
  EvalLimitItemEdgeEnum,
  EvalLimitItemParameterEnum,
  EvalSeverityEnum,
  EvalTestCaseTypeEnum,
  evalTestCaseFullCreateOrUpdateSchema,
} from "@repo/schema";
import { describe, expect, it } from "vitest";
import { v7 as uuidv7 } from "uuid";
import type { EvalTestCaseCreateOrUpdatePayload } from "@/modules/evaluation/graph/editor/serialization/backendTypes";
import {
  fromSchemaTestCase,
  toSchemaTestCase,
} from "@/modules/evaluation/graph/editor/serialization/schemaAdapters";

const limitId = uuidv7();

const editorPayload: EvalTestCaseCreateOrUpdatePayload = {
  id: uuidv7(),
  name: "Test case",
  type: "DEFECT",
  severity: "ALERT",
  enabled: true,
  limits: [
    {
      id: limitId,
      name: "Limit A",
      severity: "WARNING",
      enabled: true,
      targetLabelId: 1,
      targetParentLabelId: 2,
      limitItems: [
        {
          id: uuidv7(),
          limitFrom: 0,
          limitTo: 100,
          parameter: "POSITION",
          operator: "AND",
          quantifierType: "EXACT",
          quantifierUnit: "PCS",
          quantifierValue: 1,
          targetEdge: "TOP",
          parentEdge: "CENTER",
        },
        {
          id: null,
          limitFrom: 10,
          limitTo: 90,
          parameter: "AREA",
          operator: "OR",
          quantifierType: "MIN",
          quantifierUnit: "PERCENT",
          quantifierValue: 50,
          targetEdge: "CENTER",
          parentEdge: "CENTER",
        },
      ],
    },
  ],
  logicNodes: [
    { id: uuidv7(), type: "LIMIT" },
    { id: uuidv7(), type: "OPERATOR", operatorValue: "AND" },
    {
      id: uuidv7(),
      type: "GROUP",
      children: [{ id: uuidv7(), type: "LIMIT" }],
    },
  ],
};

describe("schemaAdapters", () => {
  it("produces output accepted by evalTestCaseFullCreateOrUpdateSchema", () => {
    const schemaPayload = toSchemaTestCase(editorPayload);
    const result = evalTestCaseFullCreateOrUpdateSchema.safeParse(schemaPayload);
    expect(result.success).toBe(true);
  });

  it("maps string literals to the nominal schema enum members", () => {
    const schemaPayload = toSchemaTestCase(editorPayload);
    expect(schemaPayload.type).toBe(EvalTestCaseTypeEnum.DEFECT);
    expect(schemaPayload.severity).toBe(EvalSeverityEnum.ALERT);
    expect(schemaPayload.limits?.[0]?.limitItems[0]?.parameter).toBe(
      EvalLimitItemParameterEnum.POSITION,
    );
    expect(schemaPayload.limits?.[0]?.limitItems[0]?.targetEdge).toBe(
      EvalLimitItemEdgeEnum.TOP,
    );
  });

  it("round-trips editor -> schema -> editor losslessly", () => {
    const roundTripped = fromSchemaTestCase(
      toSchemaTestCase(editorPayload),
      { id: editorPayload.id },
    );
    expect(roundTripped).toEqual(editorPayload);
  });
});
