import * as React from "react";
import * as monaco from "monaco-editor";
import * as ofmc from "./ofmc";
import { Output } from "./Output";

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
        theme: "vs-light",
        minimap: { enabled: false },
        wordWrap: "bounded",
        wordWrapColumn: 100,
        smoothScrolling: true,
        readOnly,
        lineNumbers: "on",
        // language: "javascript",
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

  return <div className="code-editor h-full" ref={setContainer}></div>;
};

export const App = () => {
  const { source, setSource, result, status } = ofmc.useOfmc();
  const parsed = result && ofmc.parseOfmc(result.stdout);

  const [model, setModel] = React.useState(
    monaco.editor.createModel(source, "python")
  );

  React.useEffect(() => {
    const r = model.onDidChangeContent((e) => setSource(model.getValue()));

    return () => r.dispose();
  }, [model, setSource]);

  return (
    <div className="h-screen w-screen flex">
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 w-screen border">
          {/* <textarea
            className="flex flex-1 h-full p-2 font-mono"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          ></textarea> */}
          <div className="h-full w-1/2 p-0 font-mono relative">
            <div
              className="absolute"
              style={{ top: 0, left: 0, right: 0, bottom: 0 }}
            >
              <Editor model={model} size="view" />
            </div>
          </div>
          <div className="flex flex-1 h-full w-1/2 relative">
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
        <div className="flex justify-between flex-row-reverse p-1">
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
              className="flex items-center"
              key={title}
              style={{
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                maxWidth: "15em",
              }}
              title={sub as string}
            >
              <span className="text-gray-500 text-sm mr-1">{title}:</span>{" "}
              <span className="text-gray-700 text-sm">
                {typeof text == "string" ? text.split("\n")[0] : text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
