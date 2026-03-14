import { EvalLimit, EvalTestCaseDetail } from "@repo/schema";
import { createContext, useContext } from "react";
import { LogicBuilderState } from "./useLogicBuilder.hook";

type LogicBuilderContextValue = LogicBuilderState & {
  testCase: EvalTestCaseDetail;
  /** All limits available for insertion (from the project limits list) */
  availableLimits: EvalLimit[];
};

const LogicBuilderContext = createContext<LogicBuilderContextValue | null>(null);

export function LogicBuilderProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: LogicBuilderContextValue;
}) {
  return <LogicBuilderContext value={value}>{children}</LogicBuilderContext>;
}

export function useLogicBuilderContext(): LogicBuilderContextValue {
  const ctx = useContext(LogicBuilderContext);
  if (!ctx) throw new Error("useLogicBuilderContext must be used inside LogicBuilderProvider");
  return ctx;
}
