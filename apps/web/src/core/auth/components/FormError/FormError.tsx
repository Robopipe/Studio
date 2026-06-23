import { ReactNode } from "react";

export interface FormErrorProps {
  message: string;
  /** Optional action element (e.g. a Link) rendered below the message. */
  action?: ReactNode;
}

export const FormError = ({ message, action }: FormErrorProps) => (
  <div
    role="alert"
    className="mb-8 overflow-hidden rounded border border-destructive/20 bg-destructive/5"
  >
    <div className="w-fit bg-destructive px-2 py-0.5 text-[0.65rem] font-extrabold uppercase text-white">
      ERROR
    </div>
    <div className="p-4 text-sm leading-snug text-destructive">
      {message}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  </div>
);
