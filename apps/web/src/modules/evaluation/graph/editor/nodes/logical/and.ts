import { LogicalNodeBase } from "./logicalBase";

type Props = {
  id?: string;
};

export class AndNode extends LogicalNodeBase {
  constructor(props: Props = {}) {
    super({ label: "AND", id: props.id });
  }

  clone() {
    return new AndNode();
  }
}
