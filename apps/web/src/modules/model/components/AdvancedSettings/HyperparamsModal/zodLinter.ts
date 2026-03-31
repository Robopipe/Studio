import { syntaxTree } from "@codemirror/language";
import { type Diagnostic, linter } from "@codemirror/lint";
import type { EditorState } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type { z } from "zod";

/**
 * Navigate the Lezer JSON syntax tree to find the position of a key
 * at a given path. Returns the position of the PropertyName node for
 * the last segment, or the value node for type errors.
 */
function findPropertyNamePosition(
  state: EditorState,
  path: (string | number)[],
): { from: number; to: number } | null {
  const tree = syntaxTree(state);
  let node = tree.topNode.firstChild; // Root value (Object or Array)

  for (let i = 0; i < path.length; i++) {
    if (!node) return null;
    const segment = path[i];

    if (typeof segment === "string" && node.name === "Object") {
      let prop = node.firstChild;
      let found = false;
      while (prop) {
        if (prop.name === "Property") {
          const nameNode = prop.getChild("PropertyName");
          if (nameNode) {
            const raw = state.sliceDoc(nameNode.from, nameNode.to);
            const name = raw.slice(1, -1); // strip quotes
            if (name === segment) {
              if (i === path.length - 1) {
                return { from: nameNode.from, to: nameNode.to };
              }
              // Descend into the value node
              let child = nameNode.nextSibling;
              while (child) {
                if (
                  child.name === "Object" ||
                  child.name === "Array" ||
                  child.name === "String" ||
                  child.name === "Number" ||
                  child.name === "True" ||
                  child.name === "False" ||
                  child.name === "Null"
                ) {
                  node = child;
                  break;
                }
                child = child.nextSibling;
              }
              found = true;
              break;
            }
          }
        }
        prop = prop.nextSibling;
      }
      if (!found) return null;
    } else if (typeof segment === "number" && node.name === "Array") {
      let child = node.firstChild;
      let idx = 0;
      let found = false;
      while (child) {
        if (
          child.name !== "[" &&
          child.name !== "]" &&
          child.name !== "," &&
          child.name !== "⚠"
        ) {
          if (idx === segment) {
            if (i === path.length - 1) {
              return { from: child.from, to: child.to };
            }
            node = child;
            found = true;
            break;
          }
          idx++;
        }
        child = child.nextSibling;
      }
      if (!found) return null;
    } else {
      return null;
    }
  }

  return node ? { from: node.from, to: node.to } : null;
}

/**
 * For a value-level error (wrong type), highlight the value node
 * instead of the property name.
 */
function findValuePosition(
  state: EditorState,
  path: (string | number)[],
): { from: number; to: number } | null {
  if (path.length === 0) return null;

  const parentPath = path.slice(0, -1);
  const lastSegment = path[path.length - 1];

  const tree = syntaxTree(state);
  let node = tree.topNode.firstChild;

  // Navigate to the parent
  for (const segment of parentPath) {
    if (!node) return null;
    if (typeof segment === "string" && node.name === "Object") {
      let prop = node.firstChild;
      let found = false;
      while (prop) {
        if (prop.name === "Property") {
          const nameNode = prop.getChild("PropertyName");
          if (nameNode) {
            const name = state.sliceDoc(nameNode.from + 1, nameNode.to - 1);
            if (name === segment) {
              let child = nameNode.nextSibling;
              while (child) {
                if (
                  child.name === "Object" ||
                  child.name === "Array" ||
                  child.name === "String" ||
                  child.name === "Number" ||
                  child.name === "True" ||
                  child.name === "False" ||
                  child.name === "Null"
                ) {
                  node = child;
                  break;
                }
                child = child.nextSibling;
              }
              found = true;
              break;
            }
          }
        }
        prop = prop.nextSibling;
      }
      if (!found) return null;
    }
  }

  if (!node) return null;

  // Now find the value at the last segment
  if (typeof lastSegment === "string" && node.name === "Object") {
    let prop = node.firstChild;
    while (prop) {
      if (prop.name === "Property") {
        const nameNode = prop.getChild("PropertyName");
        if (nameNode) {
          const name = state.sliceDoc(nameNode.from + 1, nameNode.to - 1);
          if (name === lastSegment) {
            // Return the value node (everything after PropertyName)
            let child = nameNode.nextSibling;
            while (child) {
              if (
                child.name === "Object" ||
                child.name === "Array" ||
                child.name === "String" ||
                child.name === "Number" ||
                child.name === "True" ||
                child.name === "False" ||
                child.name === "Null"
              ) {
                return { from: child.from, to: child.to };
              }
              child = child.nextSibling;
            }
          }
        }
      }
      prop = prop.nextSibling;
    }
  }

  return null;
}

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
