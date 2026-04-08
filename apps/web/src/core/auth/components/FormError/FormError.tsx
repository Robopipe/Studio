export interface FormErrorProps {
  message: string;
}

export const FormError = ({ message }: FormErrorProps) => (
  <div className="mb-8 overflow-hidden rounded border border-destructive/20 bg-destructive/5">
    <div className="w-fit bg-destructive px-2 py-0.5 text-[0.65rem] font-extrabold uppercase text-white">
      ERROR
    </div>
    <div className="p-4 text-sm leading-snug text-destructive">{message}</div>
  </div>
);
