import { ActionNodeBase } from "./actionBase";

type Props = {
  id?: string;
};

export class AlertNode extends ActionNodeBase {
  constructor(props: Props = {}) {
    super({ label: "Alert", evalSeverity: "ALERT", id: props.id });
  }

  clone() {
    return new AlertNode();
  }
}
