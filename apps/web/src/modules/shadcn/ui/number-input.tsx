import * as React from "react"

import { cn } from "@/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/modules/shadcn/ui/input-group"
import { Label } from "@/modules/shadcn/ui/label"

export interface NumberInputProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  label: string
  suffix?: string
  error?: boolean
}

function NumberInput({
  label,
  suffix,
  error,
  id,
  className,
  ...props
}: NumberInputProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <InputGroup>
        <InputGroupInput
          id={id}
          type="number"
          aria-invalid={error || undefined}
          {...props}
        />
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
