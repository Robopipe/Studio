import { Button } from "@/modules/shadcn/ui/button";
import { NumberInput } from "@/modules/shadcn/ui/number-input";
import { useEffect, useState } from "react";
import {
  useGetDashboardEvaluationQuery,
  useUpsertDashboardEvaluationMutation,
} from "../../services/dashboardConfigApi";

interface EvaluationPageProps {
  projectId: number;
  configId: number;
}

const GRADES = [1, 2, 3, 4] as const;

type GradeValues = {
  grade1AlertsBelow: number | null;
  grade1WarningsBelow: number | null;
  grade2AlertsBelow: number | null;
  grade2WarningsBelow: number | null;
  grade3AlertsBelow: number | null;
  grade3WarningsBelow: number | null;
  grade4AlertsBelow: number | null;
  grade4WarningsBelow: number | null;
};

export const EvaluationPage = ({
  projectId,
  configId,
}: EvaluationPageProps) => {
  const { data: evaluation } = useGetDashboardEvaluationQuery({
    projectId,
    configId,
  });
  const [upsert, { isLoading }] = useUpsertDashboardEvaluationMutation();

  const [values, setValues] = useState<GradeValues>({
    grade1AlertsBelow: null,
    grade1WarningsBelow: null,
    grade2AlertsBelow: null,
    grade2WarningsBelow: null,
    grade3AlertsBelow: null,
    grade3WarningsBelow: null,
    grade4AlertsBelow: null,
    grade4WarningsBelow: null,
  });

  useEffect(() => {
    if (evaluation) {
      setValues({
        grade1AlertsBelow: evaluation.grade1AlertsBelow,
        grade1WarningsBelow: evaluation.grade1WarningsBelow,
        grade2AlertsBelow: evaluation.grade2AlertsBelow,
        grade2WarningsBelow: evaluation.grade2WarningsBelow,
        grade3AlertsBelow: evaluation.grade3AlertsBelow,
        grade3WarningsBelow: evaluation.grade3WarningsBelow,
        grade4AlertsBelow: evaluation.grade4AlertsBelow,
        grade4WarningsBelow: evaluation.grade4WarningsBelow,
      });
    }
  }, [evaluation]);

  const handleChange = (field: keyof GradeValues, value: number | null) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await upsert({
      projectId,
      configId,
      grade1AlertsBelow: values.grade1AlertsBelow ?? 0,
      grade1WarningsBelow: values.grade1WarningsBelow ?? 0,
      grade2AlertsBelow: values.grade2AlertsBelow ?? 0,
      grade2WarningsBelow: values.grade2WarningsBelow ?? 0,
      grade3AlertsBelow: values.grade3AlertsBelow ?? 0,
      grade3WarningsBelow: values.grade3WarningsBelow ?? 0,
      grade4AlertsBelow: values.grade4AlertsBelow ?? 0,
      grade4WarningsBelow: values.grade4WarningsBelow ?? 0,
    }).unwrap();
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <h5 className="text-xl font-semibold">Evaluation Configuration</h5>

      <div className="flex flex-col gap-4">
        {GRADES.map((grade) => (
          <div key={grade} className="flex flex-row items-end gap-6">
            <div className="flex flex-1 flex-row items-end gap-2">
              <span className="min-w-[180px] whitespace-nowrap text-sm text-gray-600">
                {grade} - Alerts less than [%]
              </span>
              <NumberInput
                decimal
                value={values[`grade${grade}AlertsBelow` as keyof GradeValues]}
                onValueChange={(v) =>
                  handleChange(
                    `grade${grade}AlertsBelow` as keyof GradeValues,
                    v,
                  )
                }
              />
            </div>
            <div className="flex flex-1 flex-row items-end gap-2">
              <span className="min-w-[180px] whitespace-nowrap text-sm text-gray-600">
                {grade} - Warnings less than [%]
              </span>
              <NumberInput
                decimal
                value={
                  values[`grade${grade}WarningsBelow` as keyof GradeValues]
                }
                onValueChange={(v) =>
                  handleChange(
                    `grade${grade}WarningsBelow` as keyof GradeValues,
                    v,
                  )
                }
              />
            </div>
          </div>
        ))}

        {/* Grade 5 - catch-all, no inputs */}
        <div className="flex flex-row items-center gap-6">
          <span className="text-sm italic text-gray-500">
            5 - Everything else (catch-all)
          </span>
        </div>
      </div>

      <div className="flex flex-row justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
