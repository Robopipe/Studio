import { type Diagnostic, linter } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";
import type { z } from "zod";
import { findPropertyNamePosition, findValuePosition } from "./syntaxTreeUtils";

/**
 * Creates a CodeMirror linter extension that validates JSON content
 * against a Zod schema. Runs with a debounce delay after the user
 * stops typing. JSON syntax errors are handled by the built-in
 * jsonParseLinter — this linter only runs when JSON is valid.
 */
export function createZodLinter(schema: z.ZodType) {
  return linter(
    (view: EditorView): Diagnostic[] => {
      const doc = view.state.doc.toString().trim();
      if (!doc) return [];

      let parsed: unknown;
      try {
        parsed = JSON.parse(doc);
      } catch {
        return []; // jsonParseLinter handles syntax errors
      }

      if (
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        parsed === null
      ) {
        return [];
      }

      const result = schema.safeParse(parsed);
      if (result.success) return [];

      const diagnostics: Diagnostic[] = [];

      for (const issue of result.error.issues) {
        if (
          issue.code === "unrecognized_keys" &&
          "keys" in issue &&
          Array.isArray(issue.keys)
        ) {
          // For unrecognized keys, path points to the parent object.
          // We need to find each unrecognized key within that parent.
          for (const key of issue.keys as string[]) {
            const fullPath = [...issue.path.map(String), key];
            const pos = findPropertyNamePosition(view.state, fullPath);
            if (pos) {
              diagnostics.push({
                from: pos.from,
                to: pos.to,
                severity: "error",
                message: `Unrecognized key: "${key}"`,
              });
            }
          }
        } else {
          // For type/value errors, highlight the value node
          const pathSegments = issue.path.map((p) =>
            typeof p === "number" ? p : String(p),
          );
          const pos =
            findValuePosition(view.state, pathSegments) ??
            findPropertyNamePosition(view.state, pathSegments);

          if (pos) {
            diagnostics.push({
              from: pos.from,
              to: pos.to,
              severity: "error",
              message: issue.message,
            });
          }
        }
      }

      return diagnostics;
    },
    { delay: 500 },
  );
}
