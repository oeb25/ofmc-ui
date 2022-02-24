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
  readOnly?: boolean;
}> = ({ model, size, readOnly = false }) => {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const editorRef = React.useRef<null | monaco.editor.IStandaloneCodeEditor>(
    null
  );

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

  return <div className="h-full code-editor" ref={setContainer}></div>;
};

export const App = () => {
  const { source, setSource, result, status } = ofmc.useOfmc();
  const parsed = result && ofmc.parseOfmc(result.stdout);

  const [model] = React.useState(monaco.editor.createModel(source, "AnB"));

  React.useEffect(() => {
    const r = model.onDidChangeContent(() => setSource(model.getValue()));

    return () => r.dispose();
  }, [model, setSource]);

  return (
    <div
      className="grid w-screen h-screen"
      style={{ gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr auto" }}
    >
      {/* Input */}
      <div className="relative font-mono">
        <div className="absolute inset-0">
          <Editor model={model} size="view" />
        </div>
      </div>
      {/* Output */}
      <div className="relative flex overflow-auto">
        {parsed && result ? (
          <Output parsed={parsed} result={result} status={status} />
        ) : (
          <h1 className="self-center w-full italic text-center justify-self-center">
            Loading...
          </h1>
        )}
      </div>
      {/* Status bar */}
      <div className="flex flex-row-reverse justify-between px-2 py-1 col-span-full">
        {[
          [
            "Status",
            <div
              title={status}
              className={`w-2 h-2 rounded ${
                status == "IDLE" ? "bg-green-400" : "bg-yellow-400"
              }`}
            />,
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
        ].map(([title, text, sub = text]) => (
          <div
            className="flex items-baseline overflow-hidden whitespace-nowrap text-ellipsis"
            key={title}
            style={{
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
  );
};
