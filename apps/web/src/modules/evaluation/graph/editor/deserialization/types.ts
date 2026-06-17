// FIX(dead-code): this module is not imported anywhere in src — the deserializers import
// backendTypes directly — fix: delete the file, or actually use these aliases in
// deserializeLimits/deserializeLogicNodes/deserializeTestCase signatures; why: an unused
// parallel set of aliases (SerializedTestCase even re-declares the exact shape of
// EvalTestCaseCreateOrUpdatePayload) drifts out of date and misleads readers about which types
// are canonical.
import type {
  EvalLimitCreateOrUpdatePayload,
  EvalLimitItemCreateOrUpdatePayload,
  EvalLogicNodePayload,
  EvalSeverity,
  EvalTestCaseType,
} from "@/modules/evaluation/graph/editor/serialization/backendTypes";

export type SerializedLimit = EvalLimitCreateOrUpdatePayload;

export type SerializedLimitItem = EvalLimitItemCreateOrUpdatePayload;

export type SerializedLogicNode = EvalLogicNodePayload;

export type SerializedTestCase = {
  id: string;
  name: string;
  type: EvalTestCaseType;
  severity: EvalSeverity | null;
  limits: SerializedLimit[];
  logicNodes: SerializedLogicNode[];
};
