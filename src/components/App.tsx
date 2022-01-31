import * as monaco from "monaco-editor";
import * as React from "react";
import * as ofmc from "./ofmc";
import { Output } from "./Output";
import { id } from "../AnB";

const getTheme = async () => {
  const theme = await import("monaco-themes/themes/Oceanic Next.json");
  theme.colors["editor.background"] = "#111827";
  return theme as monaco.editor.IStandaloneThemeData;
};

export const Editor: React.FC<{
  model: monaco.editor.ITextModel;
  size: any;
  targetLine?: null | { line: number };
  readOnly?: boolean;
  fitContentHeight?: boolean;
}> = ({
  model,
  size,
  targetLine = null,
  readOnly = false,
  fitContentHeight = false,
}) => {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const editorRef = React.useRef<null | monaco.editor.IStandaloneCodeEditor>(
    null
  );

  // const { themeName, themeData } = React.useContext(ThemeContext);

  React.useEffect(() => {
    if (container) {
      const editor = (editorRef.current = monaco.editor.create(container, {
        model,
        theme: "my-theme",
        minimap: { enabled: false },
        wordWrap: "bounded",
        wordWrapColumn: 100,
        smoothScrolling: true,
        readOnly,
        lineNumbers: "on",
        language: id,
      }));

      // if (themeName) monaco.editor.setTheme(themeName);
      return () => {
        editor.dispose();
      };
    }
  }, [container]);

  React.useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.setModel(model);
    }
  }, [model, editorRef.current]);

  React.useEffect(() => {
    getTheme().then((data) => {
      monaco.editor.defineTheme("my-theme", data);
      editorRef.current?.updateOptions({ theme: "my-theme" });
    });
  }, []);

  React.useEffect(() => {
    const listener = () => {
      const editor = editorRef.current;
      if (editor) {
        editor.layout();
      }
    };

    if (editorRef.current) {
      editorRef.current.layout();
      editorRef.current.layout();
    }

    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [editorRef.current, size]);

  // React.useEffect(() => {
  //   if (!themeName || !themeData) return;
  //   monaco.editor.defineTheme(themeName, themeData);
  //   monaco.editor.setTheme(themeName);
  // }, [themeName, themeData]);

  // React.useEffect(() => {
  //   const editor = editorRef.current;
  //   if (editor && targetLine) {
  //     const range = {
  //       startLineNumber: targetLine.line,
  //       startColumn: 0,
  //       endLineNumber: targetLine.line,
  //       endColumn: 0,
  //     };
  //     editor.revealRangeAtTop(range, monaco.editor.ScrollType.Smooth);
  //     editor.setSelection({
  //       ...range,
  //       startLineNumber: range.startLineNumber + 1,
  //       endLineNumber: range.endLineNumber + 1,
  //     });
  //     editor.focus();
  //   }
  // }, [editorRef, targetLine]);

  return <div className="h-full code-editor" ref={setContainer}></div>;
};

export const App = () => {
  const { source, setSource, result, status } = ofmc.useOfmc();
  const parsed = result && ofmc.parseOfmc(result.stdout);

  const [model, setModel] = React.useState(
    monaco.editor.createModel(source, "AnB")
  );

  React.useEffect(() => {
    const r = model.onDidChangeContent((e) => setSource(model.getValue()));

    return () => r.dispose();
  }, [model, setSource]);

  return (
    <div className="flex w-screen h-screen text-white bg-gray-900">
      <div className="flex flex-col flex-1">
        <div className="flex flex-1 w-screen">
          {/* <textarea
            className="flex flex-1 h-full p-2 font-mono"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          ></textarea> */}
          <div className="relative w-1/2 h-full p-0 font-mono">
            <div
              className="absolute"
              style={{ top: 0, left: 0, right: 0, bottom: 0 }}
            >
              <Editor model={model} size="view" />
            </div>
          </div>
          <div className="relative flex flex-1 w-1/2 h-full">
            {parsed && result ? (
              <Output parsed={parsed} result={result} status={status} />
            ) : (
              <h1
                className="w-full italic"
                style={{
                  alignSelf: "center",
                  justifySelf: "center",
                  textAlign: "center",
                }}
              >
                Loading...
              </h1>
            )}
          </div>
        </div>
        <div className="flex flex-row-reverse justify-between px-2 py-1">
          {[
            [
              "Status",
              <div
                title={status}
                className={`w-2 h-2 rounded ${
                  status == "IDLE" ? "bg-green-400" : "bg-yellow-400"
                }`}
              ></div>,
              status,
            ] as const,
            ...(result?.stderr == "" && parsed
              ? [
                  ["Summary", parsed.summary],
                  ["Goal", parsed.goal],
                  // ["Backend", parsed.backend],
                  ["Statistics", parsed.statistics.join("\n")],
                ]
              : []),
          ].map(([title, text, sub = text], i) => (
            <div
              className="flex items-baseline"
              key={title}
              style={{
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                maxWidth: "15em",
              }}
              title={sub as string}
            >
              <span className="mr-1 text-sm text-gray-400">{title}:</span>{" "}
              <span className="text-sm text-gray-500">
                {typeof text == "string" ? text.split("\n")[0] : text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
