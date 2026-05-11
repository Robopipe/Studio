import * as React from "react"

import { cn } from "@/lib/utils"
import { Input } from "@/modules/shadcn/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/modules/shadcn/ui/input-group"
import { Label } from "@/modules/shadcn/ui/label"

export interface NumberInputProps
  extends Omit<
    React.ComponentProps<"input">,
    "type" | "value" | "onChange" | "defaultValue"
  > {
  value: number | null
  onValueChange: (value: number | null) => void
  label?: string
  suffix?: string
  error?: boolean
  decimal?: boolean
}

const formatForDisplay = (value: number | null): string =>
  value === null || value === undefined || Number.isNaN(value)
    ? ""
    : String(value)

function NumberInput({
  value,
  onValueChange,
  label,
  suffix,
  error,
  decimal = false,
  id,
  className,
  min,
  step,
  ...props
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = React.useState<string>(() =>
    formatForDisplay(value),
  )

  // Sync internal display with external value, but only when the parsed
  // display no longer matches the prop (so mid-typing states like "0." or
  // "020" aren't clobbered when the parent re-renders with the parsed number).
  React.useEffect(() => {
    const normalized = displayValue.replace(/,/g, ".")
    const parsed = normalized === "" ? null : Number(normalized)
    const parsedMatches =
      (parsed === null && value === null) ||
      (parsed !== null &&
        value !== null &&
        !Number.isNaN(parsed) &&
        parsed === value)
    if (!parsedMatches) {
      setDisplayValue(formatForDisplay(value))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const allowNegative = min === undefined || Number(min) < 0
  const allowedChars = decimal
    ? allowNegative
      ? /[^0-9.,-]/g
      : /[^0-9.,]/g
    : allowNegative
      ? /[^0-9-]/g
      : /[^0-9]/g

  const handleChange = (text: string) => {
    const sanitized = text.replace(allowedChars, "")
    setDisplayValue(sanitized)

    if (sanitized === "") {
      onValueChange(null)
      return
    }

    const normalized = sanitized.replace(/,/g, ".")
    if (normalized === "." || normalized === "-" || normalized === "-.") {
      return
    }

    const parsed = Number(normalized)
    if (Number.isNaN(parsed)) {
      return
    }
    onValueChange(parsed)
  }

  const inputProps = {
    id,
    type: "number" as const,
    value: displayValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      handleChange(e.target.value),
    inputMode: (decimal ? "decimal" : "numeric") as
      | "decimal"
      | "numeric",
    min,
    step,
    "aria-invalid": error || undefined,
    ...props,
  }

  if (!label && !suffix) {
    return <Input className={className} {...inputProps} />
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <InputGroup>
        <InputGroupInput {...inputProps} />
        {suffix && (
          <InputGroupAddon align="inline-end">
            <InputGroupText>{suffix}</InputGroupText>
          </InputGroupAddon>
        )}
      </InputGroup>
    </div>
  )
}

export { NumberInput }
