import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
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

export const EvaluationPage = ({
  projectId,
  configId,
}: EvaluationPageProps) => {
  const { data: evaluation } = useGetDashboardEvaluationQuery({
    projectId,
    configId,
  });
  const [upsert, { isLoading }] = useUpsertDashboardEvaluationMutation();

  const [values, setValues] = useState({
    grade1AlertsBelow: "",
    grade1WarningsBelow: "",
    grade2AlertsBelow: "",
    grade2WarningsBelow: "",
    grade3AlertsBelow: "",
    grade3WarningsBelow: "",
    grade4AlertsBelow: "",
    grade4WarningsBelow: "",
  });

  useEffect(() => {
    if (evaluation) {
      setValues({
        grade1AlertsBelow: String(evaluation.grade1AlertsBelow),
        grade1WarningsBelow: String(evaluation.grade1WarningsBelow),
        grade2AlertsBelow: String(evaluation.grade2AlertsBelow),
        grade2WarningsBelow: String(evaluation.grade2WarningsBelow),
        grade3AlertsBelow: String(evaluation.grade3AlertsBelow),
        grade3WarningsBelow: String(evaluation.grade3WarningsBelow),
        grade4AlertsBelow: String(evaluation.grade4AlertsBelow),
        grade4WarningsBelow: String(evaluation.grade4WarningsBelow),
      });
    }
  }, [evaluation]);

  const handleChange = (field: keyof typeof values, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await upsert({
      projectId,
      configId,
      grade1AlertsBelow: Number(values.grade1AlertsBelow),
      grade1WarningsBelow: Number(values.grade1WarningsBelow),
      grade2AlertsBelow: Number(values.grade2AlertsBelow),
      grade2WarningsBelow: Number(values.grade2WarningsBelow),
      grade3AlertsBelow: Number(values.grade3AlertsBelow),
      grade3WarningsBelow: Number(values.grade3WarningsBelow),
      grade4AlertsBelow: Number(values.grade4AlertsBelow),
      grade4WarningsBelow: Number(values.grade4WarningsBelow),
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
              <Input
                type="number"
                value={
                  values[`grade${grade}AlertsBelow` as keyof typeof values]
                }
                onChange={(e) =>
                  handleChange(
                    `grade${grade}AlertsBelow` as keyof typeof values,
                    e.target.value,
                  )
                }
              />
            </div>
            <div className="flex flex-1 flex-row items-end gap-2">
              <span className="min-w-[180px] whitespace-nowrap text-sm text-gray-600">
                {grade} - Warnings less than [%]
              </span>
              <Input
                type="number"
                value={
                  values[`grade${grade}WarningsBelow` as keyof typeof values]
                }
                onChange={(e) =>
                  handleChange(
                    `grade${grade}WarningsBelow` as keyof typeof values,
                    e.target.value,
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
