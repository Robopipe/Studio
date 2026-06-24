export const EmptyState = ({ message }: { message: string }) => (
  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-black/10 text-sm text-muted-foreground">
    {message}
  </div>
);
