import { EvalSeverityEnum } from "@repo/schema";
import { ActionNodeBase } from "./actionBase";

type Props = {
  id?: string;
};

export class WarningNode extends ActionNodeBase {
  constructor(props: Props = {}) {
    super({
      label: "Warning",
      evalSeverity: EvalSeverityEnum.WARNING,
      id: props.id,
    });
  }

  clone() {
    return new WarningNode();
  }
}
