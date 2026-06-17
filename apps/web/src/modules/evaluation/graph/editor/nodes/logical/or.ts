import { LogicalNodeBase } from "./logicalBase";

type Props = {
  id?: string;
};

export class OrNode extends LogicalNodeBase {
  constructor(props: Props = {}) {
    super({ label: "OR", id: props.id });
  }

  clone() {
    return new OrNode();
  }
}
