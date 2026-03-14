import { ComponentProps } from "react";

import { Button } from "@/modules/shadcn/ui/button";
import { useFormContext } from "../hooks/useFormContext";

export type SubmitButtonProps = ComponentProps<typeof Button>;

export const SubmitButton = ({ ...props }: SubmitButtonProps) => {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state) => ({ isSubmitting: state.isSubmitting })}
    >
      {({ isSubmitting }) => (
        <Button
          {...props}
          disabled={isSubmitting || props.disabled}
          onClick={form.handleSubmit}
        />
      )}
    </form.Subscribe>
  );
};
