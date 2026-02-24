import { Button, Heading, NumberInput, Stack, Text } from "@repo/ui";
import { useEffect, useState } from "react";
import {
  useGetDashboardEvaluationQuery,
  useUpsertDashboardEvaluationMutation,
} from "../../services/dashboardConfigApi";

import styles from "./EvaluationPage.module.scss";

interface EvaluationPageProps {
  projectId: number;
  configId: number;
}

const GRADES = [1, 2, 3, 4] as const;

export const EvaluationPage = ({ projectId, configId }: EvaluationPageProps) => {
  const { data: evaluation } = useGetDashboardEvaluationQuery({ projectId, configId });
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
    <Stack fullWidth gap="md">
      <Heading variant="h5" weight="600">
        Evaluation Configuration
      </Heading>

      <Stack gap={16}>
        {GRADES.map((grade) => (
          <Stack key={grade} direction="row" gap={24} align="end">
            <Stack direction="row" gap={8} align="end" className={styles.field}>
              <Text variant="text-14" className={styles.label}>
                {grade} - Alerts less than [%]
              </Text>
              <NumberInput
                label=""
                value={values[`grade${grade}AlertsBelow` as keyof typeof values]}
                onChange={(e) =>
                  handleChange(`grade${grade}AlertsBelow` as keyof typeof values, e.target.value)
                }
              />
            </Stack>
            <Stack direction="row" gap={8} align="end" className={styles.field}>
              <Text variant="text-14" className={styles.label}>
                {grade} - Warnings less than [%]
              </Text>
              <NumberInput
                label=""
                value={values[`grade${grade}WarningsBelow` as keyof typeof values]}
                onChange={(e) =>
                  handleChange(`grade${grade}WarningsBelow` as keyof typeof values, e.target.value)
                }
              />
            </Stack>
          </Stack>
        ))}

        {/* Grade 5 - catch-all, no inputs */}
        <Stack direction="row" gap={24} align="center">
          <Text variant="text-14" className={styles.gradeLabel}>
            5 - Everything else (catch-all)
          </Text>
        </Stack>
      </Stack>

      <Stack direction="row" justify="end">
        <Button variant="filled" size="md" onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </Stack>
    </Stack>
  );
};
