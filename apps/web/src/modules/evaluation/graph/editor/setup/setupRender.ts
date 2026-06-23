import { EnabledControl } from "@/modules/evaluation/graph/editor/controls/enabled";
import { IntegerRangeControl } from "@/modules/evaluation/graph/editor/controls/integerRange";
import { LabelControl } from "@/modules/evaluation/graph/editor/controls/label";
import { NameControl } from "@/modules/evaluation/graph/editor/controls/name";
import { PercentageRangeControl } from "@/modules/evaluation/graph/editor/controls/percentageRange";
import { PositionControl } from "@/modules/evaluation/graph/editor/controls/position";
import { QuantifierTypeControl } from "@/modules/evaluation/graph/editor/controls/quantifierType";
import { QuantifierUnitsControl } from "@/modules/evaluation/graph/editor/controls/quantifierUnits";
import { ActionNodeBase } from "@/modules/evaluation/graph/editor/nodes/action/actionBase";
import { AlertNode } from "@/modules/evaluation/graph/editor/nodes/action/alert";
import { WarningNode } from "@/modules/evaluation/graph/editor/nodes/action/warning";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { AreaNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/area";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import { PositionNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/position";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { OrNode } from "@/modules/evaluation/graph/editor/nodes/logical/or";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import { BooleanSocket } from "@/modules/evaluation/graph/editor/sockets/booleanSocket";
import { RuleSocket } from "@/modules/evaluation/graph/editor/sockets/ruleSocket";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import { createBooleanConnectionView } from "@/modules/evaluation/graph/editor/ui/connections/BooleanConnectionView";
import { CustomConnectionView } from "@/modules/evaluation/graph/editor/ui/connections/CustomConnectionView";
import { createLimitItemConnectionView } from "@/modules/evaluation/graph/editor/ui/connections/LimitItemConnectionView";
import { IntegerRangeControlView } from "@/modules/evaluation/graph/editor/ui/controls/IntegerRangeControlView";
import { LabelControlView } from "@/modules/evaluation/graph/editor/ui/controls/LabelControlView";
import { NameControlView } from "@/modules/evaluation/graph/editor/ui/controls/NameControlView";
import { PositionControlView } from "@/modules/evaluation/graph/editor/ui/controls/PositionControlView";
import { QuantifierTypeControlView } from "@/modules/evaluation/graph/editor/ui/controls/QuantifierControlView";
import { QuantifierUnitsControlView } from "@/modules/evaluation/graph/editor/ui/controls/QuantifierValueControlView";
import { EnabledControlView } from "@/modules/evaluation/graph/editor/ui/controls/EnabledControlView";
import { PercentageRangeControlView } from "@/modules/evaluation/graph/editor/ui/controls/RangeControlView";
import { ActionNodeView } from "@/modules/evaluation/graph/editor/ui/nodes/ActionNodeView";
import { AreaNodeView } from "@/modules/evaluation/graph/editor/ui/nodes/AreaNodeView";
import { CountNodeView } from "@/modules/evaluation/graph/editor/ui/nodes/CountNodeView";
import { LimitNodeView } from "@/modules/evaluation/graph/editor/ui/nodes/LimitNodeView";
import { LogicalNodeView } from "@/modules/evaluation/graph/editor/ui/nodes/LogicalNodeView";
import { PositionNodeView } from "@/modules/evaluation/graph/editor/ui/nodes/PositionNodeView";
import { ResultNodeView } from "@/modules/evaluation/graph/editor/ui/nodes/ResultNodeView";
import { SocketView } from "@/modules/evaluation/graph/editor/ui/sockets/SocketView";
import { createRoot } from "react-dom/client";
import { NodeEditor } from "rete";
import type { AreaPlugin } from "rete-area-plugin";
import { Presets, ReactPlugin } from "rete-react-plugin";
import type { AreaExtra } from "./createEditor";

type Props = {
  editor: NodeEditor<Schemes>;
  area: AreaPlugin<Schemes, AreaExtra>;
};

/**
 * Configures the React rendering layer for the editor.
 *
 * Rete dispatches rendering through a `customize` object of callbacks. Each
 * callback receives a `context` with a `payload` holding the data model
 * instance, so you branch on `instanceof` to map nodes/controls/connections/
 * sockets to their specific React components.
 *
 * Connection views that need to re-render on state changes (e.g. OR/NOT toggle)
 * are created via factories that receive an `area.update` callback, because
 * Rete does not automatically re-render connections when their data model changes.
 */
export function setupRender(props: Props): ReactPlugin<Schemes, AreaExtra> {
  const { editor, area } = props;

  const render = new ReactPlugin<Schemes, AreaExtra>({ createRoot });

  render.addPreset(
    Presets.classic.setup({
      customize: {
        control(context) {
          if (context.payload instanceof PercentageRangeControl) {
            return PercentageRangeControlView;
          }
          if (context.payload instanceof QuantifierUnitsControl) {
            return QuantifierUnitsControlView;
          }
          if (context.payload instanceof IntegerRangeControl) {
            return IntegerRangeControlView;
          }
          if (context.payload instanceof QuantifierTypeControl) {
            return QuantifierTypeControlView;
          }
          if (context.payload instanceof PositionControl) {
            return PositionControlView;
          }
          if (context.payload instanceof NameControl) {
            return NameControlView;
          }
          if (context.payload instanceof LabelControl) {
            return LabelControlView;
          }
          if (context.payload instanceof EnabledControl) {
            return EnabledControlView;
          }
          return null;
        },
        connection(context) {
          const sourceNode = editor.getNode(context.payload.source);
          const targetNode = editor.getNode(context.payload.target);

          if (!sourceNode || !targetNode) {
            return CustomConnectionView;
          }

          const sourcePort = (
            sourceNode.outputs as Record<
              string,
              { socket: unknown } | undefined
            >
          )[String(context.payload.sourceOutput)];

          const targetPort = (
            targetNode.inputs as Record<string, { socket: unknown } | undefined>
          )[String(context.payload.targetInput)];

          const sourceSocket = sourcePort?.socket;
          const targetSocket = targetPort?.socket;

          if (
            sourceSocket instanceof RuleSocket &&
            targetSocket instanceof RuleSocket
          ) {
            return createLimitItemConnectionView((id) => {
              void area.update("connection", id);
            });
          }

          if (
            sourceSocket instanceof BooleanSocket &&
            targetSocket instanceof BooleanSocket
          ) {
            if (targetNode instanceof ActionNodeBase)
              return CustomConnectionView;

            // An And/Or node feeding the Result is a plain edge: the whole result
            // can't be negated (no DEFECT, no group-NOT in the table view). Only a
            // single Limit -> Result may carry NOT, so it keeps the toggle.
            if (
              targetNode instanceof ResultNode &&
              (sourceNode instanceof AndNode || sourceNode instanceof OrNode)
            ) {
              return CustomConnectionView;
            }

            return createBooleanConnectionView((id) => {
              void area.update("connection", id);
            });
          }

          return CustomConnectionView;
        },
        socket(context) {
          if (
            context.payload instanceof RuleSocket ||
            context.payload instanceof BooleanSocket
          ) {
            return SocketView;
          }

          return Presets.classic.Socket;
        },
        node(context) {
          if (context.payload instanceof PositionNode) {
            return PositionNodeView;
          }
          if (context.payload instanceof AreaNode) {
            return AreaNodeView;
          }
          if (context.payload instanceof CountNode) {
            return CountNodeView;
          }
          if (context.payload instanceof LimitNode) {
            return LimitNodeView;
          }
          if (
            context.payload instanceof AndNode ||
            context.payload instanceof OrNode
          ) {
            return LogicalNodeView;
          }
          if (
            context.payload instanceof AlertNode ||
            context.payload instanceof WarningNode
          ) {
            return ActionNodeView;
          }
          if (context.payload instanceof ResultNode) {
            return ResultNodeView;
          }

          return Presets.classic.Node;
        },
      },
    }),
  );

  return render;
}
