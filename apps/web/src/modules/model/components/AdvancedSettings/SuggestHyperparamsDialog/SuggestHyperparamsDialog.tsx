import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/modules/shadcn/ui/alert";
import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { NumberInput } from "@/modules/shadcn/ui/number-input";
import { Spinner } from "@/modules/shadcn/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/modules/shadcn/ui/table";
import {
  HYPERPARAM_SUGGESTION_REGISTRY,
  SuggestHyperparamsRequest,
  SuggestionWarning,
  SuggestionWarningSeverityEnum,
} from "@repo/schema";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router";
import { toast } from "sonner";
import { useSuggestHyperparamsMutation } from "../../../services";
import { SuggestedParamRow, SuggestedValue } from "./SuggestedParamRow";

export interface AppliedSuggestion {
  epochs: number;
  params: Record<string, string | number | boolean>;
}

export interface SuggestHyperparamsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: SuggestHyperparamsRequest & { projectId: number };
  onApply: (result: AppliedSuggestion) => void;
}

const WARNING_STYLES: Record<
  SuggestionWarningSeverityEnum,
  { className: string; Icon: typeof AlertTriangle }
> = {
  [SuggestionWarningSeverityEnum.CRITICAL]: {
    className: "border-red-200 bg-red-50 text-red-800",
    Icon: AlertCircle,
  },
  [SuggestionWarningSeverityEnum.WARNING]: {
    className: "border-amber-200 bg-amber-50 text-amber-800",
    Icon: AlertTriangle,
  },
  [SuggestionWarningSeverityEnum.INFO]: {
    className: "border-blue-200 bg-blue-50 text-blue-800",
    Icon: Info,
  },
};

const WarningAlert = ({ warning }: { warning: SuggestionWarning }) => {
  const { className, Icon } = WARNING_STYLES[warning.severity];
  return (
    <Alert className={cn("py-2", className)}>
      <Icon className="size-4" />
      <AlertTitle className="text-sm font-medium">{warning.message}</AlertTitle>
      {warning.affectedLabels && warning.affectedLabels.length > 0 && (
        <AlertDescription>
          <div className="flex flex-row flex-wrap gap-1 pt-1">
            {warning.affectedLabels.map((label) => (
              <span
                key={label}
                className="rounded-full border border-current/30 px-2 text-xs leading-5"
              >
                {label}
              </span>
            ))}
          </div>
        </AlertDescription>
      )}
    </Alert>
  );
};

const extractErrorMessage = (err: unknown): string =>
  typeof err === "object" &&
  err !== null &&
  "data" in err &&
  typeof (err as { data?: { message?: unknown } }).data?.message === "string"
    ? (err as { data: { message: string } }).data.message
    : "Failed to get AI suggestions. Please try again.";

export const SuggestHyperparamsDialog = ({
  open,
  onOpenChange,
  context,
  onApply,
}: SuggestHyperparamsDialogProps) => {
  const [suggest, { data, isLoading, error }] = useSuggestHyperparamsMutation();
  const requestRef = useRef<ReturnType<typeof suggest> | null>(null);
  const [edited, setEdited] = useState<Record<string, SuggestedValue>>({});
  const [editedEpochs, setEditedEpochs] = useState<number | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  const entry = HYPERPARAM_SUGGESTION_REGISTRY[context.backend];

  useEffect(() => {
    if (!open) return;
    setApplyError(null);
    requestRef.current = suggest(context);
    // Fire once per dialog open — the context snapshot is taken at open time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // The Gemini result only exists in this dialog — losing it mid-request means
  // paying for the call again. Block in-app navigation while it's in flight.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isLoading && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      toast.warning("AI suggestion in progress — cancel it before leaving.");
      blocker.reset?.();
    }
  }, [blocker]);

  useEffect(() => {
    if (!isLoading) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isLoading]);

  const handleCancel = () => {
    if (isLoading) requestRef.current?.abort();
    onOpenChange(false);
  };

  useEffect(() => {
    if (!data) return;
    setEditedEpochs(data.epochs.value);
    setEdited(
      Object.fromEntries(
        Object.entries(data.params).map(([name, param]) => [name, param.value]),
      ),
    );
  }, [data]);

  const paramNames =
    data && entry
      ? Object.keys(entry.params).filter((name) => name in data.params)
      : [];

  const handleApply = () => {
    if (!entry || !data) return;
    if (editedEpochs === null || editedEpochs <= 0) {
      setApplyError("Epochs must be greater than 0");
      return;
    }
    const params = Object.fromEntries(
      Object.entries(edited).filter(([, value]) => value !== null),
    ) as Record<string, string | number | boolean>;
    const result = entry.paramsSchema.safeParse(params);
    if (!result.success) {
      const issue = result.error.issues[0];
      setApplyError(
        issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid values",
      );
      return;
    }
    onApply({ epochs: editedEpochs, params });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // While the request is in flight, only the Cancel button (which
        // aborts) may close the dialog — not escape, backdrop, or the X.
        if (!next && isLoading) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="flex max-h-[90vh] flex-col gap-0 sm:max-w-[760px]"
        showCloseButton={!isLoading}
      >
        <DialogHeader>
          <DialogTitle>AI Suggested Training Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto py-4">
          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Spinner className="size-6 text-emerald-700" />
              <span className="text-sm text-black/60">
                Analyzing your dataset…
              </span>
            </div>
          )}

          {!isLoading && error !== undefined && (
            <div className="flex flex-col items-center gap-3 py-10">
              <span className="text-sm text-red-600">
                {extractErrorMessage(error)}
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  requestRef.current = suggest(context);
                }}
              >
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && data && (
            <>
              {data.warnings.length > 0 && (
                <div className="flex flex-col gap-2">
                  {data.warnings.map((warning, i) => (
                    <WarningAlert key={i} warning={warning} />
                  ))}
                </div>
              )}
              <p className="text-sm leading-5 text-black/60">{data.summary}</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Suggested</TableHead>
                    <TableHead>Reasoning</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="align-top">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-black/90">
                          Epochs
                        </span>
                        <span className="font-mono text-xs text-black/50">
                          epochs
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-sm text-black/60">
                      {context.epochs ?? "—"}
                    </TableCell>
                    <TableCell className="align-top">
                      <NumberInput
                        className="w-28"
                        min={1}
                        value={editedEpochs}
                        onValueChange={setEditedEpochs}
                      />
                    </TableCell>
                    <TableCell className="max-w-64 align-top text-xs leading-4 text-black/60">
                      {data.epochs.reasoning}
                    </TableCell>
                  </TableRow>
                  {entry &&
                    paramNames.map((name) => (
                      <SuggestedParamRow
                        key={name}
                        name={name}
                        def={entry.params[name]}
                        currentValue={context.currentHyperparams[name]}
                        value={edited[name] ?? null}
                        reasoning={data.params[name].reasoning}
                        onChange={(value) =>
                          setEdited((prev) => ({ ...prev, [name]: value }))
                        }
                      />
                    ))}
                </TableBody>
              </Table>
              <span className="text-xs text-black/50">
                Based on dataset analytics and {data.sampledTaskIds.length}{" "}
                sample image{data.sampledTaskIds.length === 1 ? "" : "s"}.
                Review the values before applying.
              </span>
            </>
          )}
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 border-t border-black/10 pt-4">
          {applyError && (
            <span className="mr-auto text-xs text-red-600">{applyError}</span>
          )}
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={isLoading || !data}>
            Apply suggestions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
