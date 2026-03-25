import { autocompletion, closeBrackets } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { bracketMatching, foldGutter, indentOnInput } from "@codemirror/language";
import { lintGutter, linter } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { EditorState, type Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseCodeMirrorOptions {
  initialValue: string;
  onChange: (value: string) => void;
  /** Additional CodeMirror extensions (e.g. custom linters). */
  extensions?: Extension[];
}

export function useCodeMirror({
  initialValue,
  onChange,
  extensions: extraExtensions = [],
}: UseCodeMirrorOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [view, setView] = useState<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        foldGutter(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightSelectionMatches(),
        json(),
        linter(jsonParseLinter()),
        ...extraExtensions,
        lintGutter(),
        oneDark,
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const editorView = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = editorView;
    setView(editorView);

    return () => {
      editorView.destroy();
      viewRef.current = null;
      setView(null);
    };
    // Only create the editor once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setValue = useCallback((value: string) => {
    const v = viewRef.current;
    if (!v) return;
    v.dispatch({
      changes: {
        from: 0,
        to: v.state.doc.length,
        insert: value,
      },
    });
  }, []);

  return { containerRef, view, setValue };
}
