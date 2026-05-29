"use client";

import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { rust } from "@codemirror/lang-rust";
import { go } from "@codemirror/lang-go";
import { EditorView } from "@codemirror/view";

type Props = {
  value: string;
  onChange: (val: string) => void;
  language?: string;
};

function getLanguageExtension(language: string) {
  switch (language.toLowerCase()) {
    case "python":       return python();
    case "javascript":  return javascript();
    case "typescript":  return javascript({ typescript: true });
    case "java":        return java();
    case "c++":         return cpp();
    case "rust":        return rust();
    case "go":          return go();
    default:            return javascript();
  }
}

const baseTheme = EditorView.theme({
  "&": { height: "100%", fontSize: "13px" },
  ".cm-scroller": { fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace", lineHeight: "1.7", overflow: "auto" },
  ".cm-content": { padding: "16px 0" },
  ".cm-gutters": { borderRight: "1px solid #2d2d2d", paddingRight: "8px" },
  ".cm-lineNumbers .cm-gutterElement": { minWidth: "40px", color: "#555", paddingLeft: "8px" },
  ".cm-activeLine": { backgroundColor: "#ffffff08" },
  ".cm-activeLineGutter": { backgroundColor: "#ffffff08" },
  ".cm-selectionBackground": { backgroundColor: "#264f78 !important" },
  "::selection": { backgroundColor: "#264f78" },
});

export function CodeEditor({ value, onChange, language = "Python" }: Props) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme={vscodeDark}
      extensions={[getLanguageExtension(language), baseTheme]}
      height="100%"
      style={{ height: "100%" }}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: true,
        highlightSpecialChars: true,
        foldGutter: false,
        dropCursor: false,
        allowMultipleSelections: false,
        indentOnInput: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
        highlightActiveLine: true,
        highlightSelectionMatches: true,
        tabSize: language.toLowerCase() === "python" ? 4 : 2,
      }}
    />
  );
}
