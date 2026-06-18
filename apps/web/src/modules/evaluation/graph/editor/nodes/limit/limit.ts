import { EnabledControl } from "@/modules/evaluation/graph/editor/controls/enabled";
import {
  LabelControl,
  type LabelOption,
} from "@/modules/evaluation/graph/editor/controls/label";
import { NameControl } from "@/modules/evaluation/graph/editor/controls/name";
import {
  AppNode,
  type NodeMinSize,
  type NodePadding,
} from "@/modules/evaluation/graph/editor/nodes/appNode";
import { BooleanSocket } from "@/modules/evaluation/graph/editor/sockets/booleanSocket";
import type {
  NodeGroup,
  NoSockets,
} from "@/modules/evaluation/graph/editor/types";
import { ClassicPreset } from "rete";

type Props = {
  id?: string;
  name?: string;
  label?: number | string | null;
  parentLabel?: number | string | null;
  enabled?: boolean;
  /** Selectable label options, sourced from the project (see GraphEditor). */
  labels?: LabelOption[];
};

export class LimitNode extends AppNode<
  NoSockets,
  { out: ClassicPreset.Socket },
  {
    name: NameControl;
    label: LabelControl;
    parentLabel: LabelControl;
    enabled: EnabledControl;
  }
> {
  controlsHeight = 7;
  initialWidth = 15;
  // 5 here is the empty space reserved for children (node will grow anyways when a child is added, but this way it looks better when it's empty)
  initialHeight =
    this.controlsHeight + this.labelHeight + this.socketHeight + 5;

  width = this.getSnappedSize(this.initialWidth);
  height = this.getSnappedSize(this.initialHeight);

  nodeGroup = "limit" as const;
  allowedChildGroups = ["rule"] as NodeGroup[];

  constructor(props: Props = {}) {
    const {
      id,
      name,
      label = null,
      parentLabel = null,
      enabled = true,
      labels = [],
    } = props;
    super({ label: "Limit", id });

    this.addControl("name", new NameControl({ initialValue: name }));
    this.addControl(
      "label",
      new LabelControl(labels, { required: true, initialValue: label }),
    );
    this.addControl(
      "parentLabel",
      new LabelControl(labels, { required: false, initialValue: parentLabel }),
    );
    this.addControl("enabled", new EnabledControl({ initialValue: enabled }));

    this.addOutput("out", new ClassicPreset.Output(new BooleanSocket(), "OUT"));
  }

  get name() {
    return this.controls.name.value;
  }

  get enabledValue() {
    return this.controls.enabled.value;
  }

  get labelValue() {
    return this.controls.label.value;
  }

  get parentLabelValue() {
    return this.controls.parentLabel.value;
  }

  getPadding(): NodePadding {
    return {
      top: this.getSnappedSize(this.controlsHeight + this.labelHeight + 1),
      bottom: this.getSnappedSize(this.socketHeight + 1),
      left: this.getSnappedSize(),
      right: this.getSnappedSize(),
    };
  }

  getMinSize(): NodeMinSize {
    return {
      width: this.getSnappedSize(this.initialWidth),
      height: this.getSnappedSize(this.initialHeight),
    };
  }

  clone() {
    // why: it looks like a copy-paste bug and surprises users whose pasted node shows an error.
    // name is not cloned as the name will most likely be changed by the user, ommiting the name
    // from the clone method forces the user to change the name.
    return new LimitNode({
      labels: [...this.controls.label.options],
      name: "",
      label: this.labelValue,
      parentLabel: this.parentLabelValue,
      enabled: this.enabledValue,
    });
  }
}
