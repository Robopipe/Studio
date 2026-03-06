import {
  DashboardConfigurationItem,
  DashboardConfigurationItemLimitUnitEnum,
  DashboardConfigurationItemPositionEnum,
  DashboardConfigurationItemSeverityEnum,
  DashboardConfigurationItemTypeEnum,
  Label,
} from "@repo/schema";
import {
  Button,
  Heading,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
} from "@repo/ui";
import clsx from "clsx";
import { useState } from "react";
import {
  useCreateDashboardConfigItemMutation,
  useUpdateDashboardConfigItemMutation,
} from "../../services/dashboardConfigApi";
import { PositionBox } from "../PositionBox";

import styles from "./AddLimitModal.module.scss";

interface AddLimitModalProps {
  projectId: number;
  configId: number;
  labels: Label[];
  item?: DashboardConfigurationItem;
  onClose: () => void;
}

const typeOptions = [
  { label: "Check", value: DashboardConfigurationItemTypeEnum.CHECK },
  { label: "Defect", value: DashboardConfigurationItemTypeEnum.DEFECT },
];

const severityOptions = [
  { label: "Alert", value: DashboardConfigurationItemSeverityEnum.ALERT },
  { label: "Warning", value: DashboardConfigurationItemSeverityEnum.WARNING },
];

const unitOptions = [
  {
    label: "Percentage",
    value: DashboardConfigurationItemLimitUnitEnum.PERCENTAGE,
  },
  { label: "Count", value: DashboardConfigurationItemLimitUnitEnum.COUNT },
];

/** High-level parameter categories shown in the dropdown */
type ParameterCategory = "COUNT" | "AREA" | "POSITION";

const parameterOptions: { label: string; value: ParameterCategory }[] = [
  { label: "Count", value: "COUNT" },
  { label: "Area", value: "AREA" },
  { label: "Position", value: "POSITION" },
];

const parameterSelectItems = parameterOptions.map((o) => ({
  label: o.label,
  value: o.value,
}));

/** Map a position enum value back to a ParameterCategory */
function positionToCategory(
  pos: DashboardConfigurationItemPositionEnum,
): ParameterCategory {
  if (pos === DashboardConfigurationItemPositionEnum.COUNT) return "COUNT";
  if (pos === DashboardConfigurationItemPositionEnum.AREA) return "AREA";
  return "POSITION";
}

/** Check if a position enum value is a spatial position (needs the box) */
function isPositionType(pos: DashboardConfigurationItemPositionEnum): boolean {
  return ![
    DashboardConfigurationItemPositionEnum.COUNT,
    DashboardConfigurationItemPositionEnum.AREA,
  ].includes(pos);
}

/** State shape for a single limit pair in the form */
interface LimitPairState {
  from: string;
  to: string;
}

function initLimitPairs(item?: DashboardConfigurationItem): LimitPairState[] {
  if (item?.limits && item.limits.length > 0) {
    return item.limits.map((l) => ({
      from: l.from?.toString() ?? "",
      to: l.to?.toString() ?? "",
    }));
  }
  return [{ from: "", to: "" }];
}

function hasLimitPairError(pair: LimitPairState): boolean {
  const fromNum = Number(pair.from);
  const toNum = Number(pair.to);
  return (
    (pair.from === "" && pair.to === "") ||
    (pair.from !== "" && isNaN(fromNum)) ||
    (pair.to !== "" && isNaN(toNum)) ||
    (pair.from !== "" && pair.to !== "" && fromNum > toNum)
  );
}

export const AddLimitModal = ({
  projectId,
  configId,
  labels,
  item,
  onClose,
}: AddLimitModalProps) => {
  const isEdit = !!item;

  const [name, setName] = useState(item?.name ?? "");
  const [type, setType] = useState<DashboardConfigurationItemTypeEnum>(
    item?.type ?? DashboardConfigurationItemTypeEnum.CHECK,
  );
  const [severity, setSeverity] =
    useState<DashboardConfigurationItemSeverityEnum>(
      item?.severity ?? DashboardConfigurationItemSeverityEnum.ALERT,
    );
  const [targetLabelId, setTargetLabelId] = useState<string>(
    item?.targetLabel.id.toString() ?? "",
  );
  const [targetParentLabelId, setTargetParentLabelId] = useState<string>(
    item?.targetParentLabel?.id.toString() ?? "",
  );
  const [position, setPosition] =
    useState<DashboardConfigurationItemPositionEnum>(
      item?.position ?? DashboardConfigurationItemPositionEnum.COUNT,
    );
  const [limitPairs, setLimitPairs] = useState<LimitPairState[]>(
    initLimitPairs(item),
  );
  const [unit, setUnit] = useState<DashboardConfigurationItemLimitUnitEnum>(
    item?.unit ?? DashboardConfigurationItemLimitUnitEnum.PERCENTAGE,
  );

  const [createItem, { isLoading: isCreating }] =
    useCreateDashboardConfigItemMutation();
  const [updateItem, { isLoading: isUpdating }] =
    useUpdateDashboardConfigItemMutation();

  const isLoading = isCreating || isUpdating;

  const parameterCategory = positionToCategory(position);
  const showPositionBox = parameterCategory === "POSITION";

  const labelItems = labels.map((l) => ({
    label: l.name,
    value: l.id.toString(),
  }));

  const handleParameterChange = (cat: ParameterCategory) => {
    if (cat === "POSITION" && !isPositionType(position)) {
      setPosition(DashboardConfigurationItemPositionEnum.POS_CENTER);
      setUnit(DashboardConfigurationItemLimitUnitEnum.PERCENTAGE);
    } else if (cat === "COUNT") {
      setPosition(DashboardConfigurationItemPositionEnum.COUNT);
      setUnit(DashboardConfigurationItemLimitUnitEnum.COUNT);
    } else if (cat === "AREA") {
      setPosition(DashboardConfigurationItemPositionEnum.AREA);
      setUnit(DashboardConfigurationItemLimitUnitEnum.PERCENTAGE);
    }
  };

  const hasLimitError = limitPairs.some(hasLimitPairError);

  const updatePair = (index: number, field: "from" | "to", value: string) => {
    setLimitPairs((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  };

  const addPair = () => {
    setLimitPairs((prev) => [...prev, { from: "", to: "" }]);
  };

  const removePair = (index: number) => {
    setLimitPairs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim() || !targetLabelId || hasLimitError) return;

    const limits = limitPairs.map((p) => ({
      from: p.from !== "" ? Number(p.from) : null,
      to: p.to !== "" ? Number(p.to) : null,
    }));

    const payload = {
      name,
      type,
      severity,
      position,
      unit,
      targetLabelId: Number(targetLabelId),
      targetParentLabelId: targetParentLabelId
        ? Number(targetParentLabelId)
        : null,
      limits,
    };

    if (isEdit) {
      await updateItem({
        projectId,
        configId,
        itemId: item.id,
        ...payload,
      }).unwrap();
    } else {
      await createItem({ projectId, configId, ...payload }).unwrap();
    }

    onClose();
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <Heading variant="h4" weight="700">
          {isEdit ? "Edit Limit" : "Add Limit"}
        </Heading>

        <Stack gap={24} className={styles.form}>
          {/* General section */}
          <Stack gap={12}>
            <Text weight="700">General</Text>
            <TextInput
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Limit name"
            />
          </Stack>

          {/* Type and Severity toggles */}
          <Stack direction="row" gap={48}>
            <Stack gap={8}>
              <Text weight="700">Type</Text>
              <Stack direction="row" gap={8}>
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={clsx(
                      styles.toggleButton,
                      type === opt.value && styles.active,
                    )}
                    onClick={() => setType(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </Stack>
            </Stack>

            <Stack gap={8}>
              <Text weight="700">If not fulfilled</Text>
              <Stack direction="row" gap={8}>
                {severityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={clsx(
                      styles.toggleButton,
                      severity === opt.value && styles.active,
                    )}
                    onClick={() => setSeverity(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </Stack>
            </Stack>
          </Stack>

          {/* Setup section */}
          <Stack gap={12}>
            <Text weight="700">Setup</Text>

            <Stack direction="row" gap={16} align="end">
              <Stack gap={4} className={styles.fieldGroup}>
                <Text variant="text-14">Label</Text>
                <Select
                  items={labelItems}
                  placeholder="Select label"
                  value={targetLabelId}
                  onValueChange={(val) => val && setTargetLabelId(val)}
                />
              </Stack>
              <Stack gap={4} className={styles.fieldGroup}>
                <Text variant="text-14">In</Text>
                <Select
                  items={[{ label: "IMAGE", value: "" }, ...labelItems]}
                  placeholder="IMAGE"
                  value={targetParentLabelId}
                  onValueChange={(val) =>
                    val !== null && setTargetParentLabelId(val)
                  }
                />
              </Stack>
              <Stack gap={4} className={styles.fieldGroup}>
                <Text variant="text-14">Parameter</Text>
                <Select
                  items={parameterSelectItems}
                  placeholder="Select parameter"
                  value={parameterCategory}
                  onValueChange={(val) =>
                    val && handleParameterChange(val as ParameterCategory)
                  }
                />
              </Stack>
              {showPositionBox && (
                <PositionBox value={position} onChange={setPosition} />
              )}
            </Stack>

            <Stack direction="row" gap={16} align="end">
              <Stack gap={4}>
                <Text variant="text-14">Units</Text>
                <Stack direction="row" gap={8}>
                  {unitOptions.map((opt) => {
                    const allowed =
                      parameterCategory === "COUNT"
                        ? opt.value ===
                          DashboardConfigurationItemLimitUnitEnum.COUNT
                        : opt.value ===
                          DashboardConfigurationItemLimitUnitEnum.PERCENTAGE;
                    return (
                      <button
                        key={opt.value}
                        className={clsx(
                          styles.toggleButton,
                          unit === opt.value && styles.active,
                          !allowed && styles.disabled,
                        )}
                        onClick={() => allowed && setUnit(opt.value)}
                        disabled={!allowed}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </Stack>
              </Stack>
            </Stack>

            {/* Limit pairs */}
            <Stack gap={0}>
              {limitPairs.map((pair, index) => {
                const pairError = hasLimitPairError(pair);
                return (
                  <div key={index}>
                    {index > 0 && (
                      <div className={styles.orSeparator}>
                        <span className={styles.orLabel}>OR</span>
                      </div>
                    )}
                    <Stack
                      direction="row"
                      gap={16}
                      align="end"
                      className={styles.limitPairRow}
                    >
                      <NumberInput
                        label={index === 0 ? "Limit from" : ""}
                        value={pair.from}
                        onChange={(e) =>
                          updatePair(index, "from", e.target.value)
                        }
                        error={pairError}
                      />
                      <NumberInput
                        label={index === 0 ? "Limit to" : ""}
                        value={pair.to}
                        onChange={(e) =>
                          updatePair(index, "to", e.target.value)
                        }
                        error={pairError}
                      />
                      {limitPairs.length > 1 && (
                        <button
                          type="button"
                          className={styles.removePairButton}
                          onClick={() => removePair(index)}
                          aria-label="Remove limit pair"
                        >
                          &times;
                        </button>
                      )}
                    </Stack>
                  </div>
                );
              })}
              <button
                type="button"
                className={styles.addPairButton}
                onClick={addPair}
              >
                + Add limit range
              </button>
            </Stack>
          </Stack>
        </Stack>

        <Stack direction="row" justify="end" gap={12} className={styles.footer}>
          <Button
            variant="outlined"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            size="sm"
            onClick={handleSave}
            disabled={
              isLoading || !name.trim() || !targetLabelId || hasLimitError
            }
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </Stack>
      </div>
    </div>
  );
};
