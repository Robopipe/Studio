import { Label } from "@/modules/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import type { FormInstance, LabelOption } from "./types";

type SetupSectionProps = {
  form: FormInstance;
  labelOptions: LabelOption[];
};

export function SetupSection({ form, labelOptions }: SetupSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h6 className="text-sm font-bold">Setup</h6>
      <div className="flex gap-3">
        <form.Field name="targetLabelId">
          {(field) => (
            <div className="flex flex-1 flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Label</Label>
              <Select
                value={String(field.state.value || "")}
                onValueChange={(v) => field.handleChange(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select label" />
                </SelectTrigger>
                <SelectContent>
                  {labelOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <form.Field name="targetParentLabelId">
          {(field) => (
            <div className="flex flex-1 flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Parent Label</Label>
              <Select
                value={String(field.state.value ?? "")}
                onValueChange={(v) =>
                  field.handleChange(v === "" ? null : Number(v))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select label" />
                </SelectTrigger>
                <SelectContent>
                  {labelOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>
      </div>
    </section>
  );
}
