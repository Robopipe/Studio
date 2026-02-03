import { ModelOutputTypeEnum } from "@repo/schema";
import { Button } from "@repo/ui";
import { SettingsCard } from "../SettingsCard";

export interface OutputSettingsProps {
  outputs: ModelOutputTypeEnum[];
  setOutputs: (outputs: ModelOutputTypeEnum[]) => void;
}

export const OutputSettings = ({
  outputs,
  setOutputs,
}: OutputSettingsProps) => {
  return (
    <SettingsCard
      title="outputs"
      state={outputs.length ? "complete" : "pending"}
      stepNumber={5}
    >
      {Object.values(ModelOutputTypeEnum).map((outputType) => (
        <Button
          key={outputType}
          variant={outputs.includes(outputType) ? "filled" : "outlined"}
          onClick={() => {
            if (outputs.includes(outputType)) {
              setOutputs(outputs.filter((type) => type !== outputType));
            } else {
              setOutputs([...outputs, outputType]);
            }
          }}
        >
          {outputType}
        </Button>
      ))}
    </SettingsCard>
  );
};
