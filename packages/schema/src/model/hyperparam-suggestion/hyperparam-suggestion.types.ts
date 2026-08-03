import z from "zod";
import {
  suggestedParamSchema,
  suggestedSplitSchema,
  suggestHyperparamsRequestSchema,
  suggestHyperparamsResponseSchema,
  suggestionWarningSchema,
} from "./hyperparam-suggestion.schema";

export type SuggestHyperparamsRequest = z.infer<
  typeof suggestHyperparamsRequestSchema
>;
export type SuggestHyperparamsResponse = z.infer<
  typeof suggestHyperparamsResponseSchema
>;
export type SuggestionWarning = z.infer<typeof suggestionWarningSchema>;
export type SuggestedParam = z.infer<typeof suggestedParamSchema>;
export type SuggestedSplit = z.infer<typeof suggestedSplitSchema>;
