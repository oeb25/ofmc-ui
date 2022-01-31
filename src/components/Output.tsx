import * as React from "react";
import * as ofmc from "./ofmc";
import { Katex } from "./Katex";

const OfmcMsg: React.FC<{
  m: string;
  onHover: (name: string | null) => void;
}> = ({ m, onHover }) => {
  const [hover, setHover] = React.useState<string | null>(null);

  const onMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
      let t = e.target as HTMLElement;

      let i = -1;
      let left = 100;

      while ((i = t.className.indexOf("ident-x-")) == -1 && left-- > 0) {
        if (!t.parentElement) return setHover(null);
        t = t.parentElement;
      }

      if (left <= 0) return setHover(null);

      const name = t.className.substring(
        i,
        (t.className.indexOf(" ", i + 1) + 1 || t.className.length + 1) - 1
      );

      setHover(name);
    },
    []
  );

  React.useEffect(() => {
    onHover(hover);
  }, [onHover, hover]);

  return (
    <span onMouseMove={onMouseMove} onMouseLeave={() => setHover(null)}>
      <Katex src={ofmc.msgToLatex(m)} />
    </span>
  );
};

export const Output: React.FC<{
  result: {
    err: string;
    stdout: string;
    stderr: string;
  };
  parsed: ofmc.ParsedOfmc;
  status: ofmc.Status;
}> = ({ result, parsed, status }) => {
  const [hover, setHover] = React.useState<string | null>(null);

  return (
    <>
      {status !== "IDLE" ? (
        <p className="absolute top-0 right-0 flex items-center p-2 italic text-gray-600">
          {/* Analysing... */}
          <p className="w-6 h-6 m-1 border-t-4 border-r border-gray-600 rounded-full spin"></p>
        </p>
      ) : null}
      {result.stderr == "" && !parsed.attackTrace && (
        <div className="flex items-center justify-center w-full">
          <p className="p-2 text-xl text-green-400">No attack found</p>
        </div>
      )}
      {result.stderr == "" &&
        parsed.attackTrace &&
        parsed.attackTrace.length > 0 && (
          <div className="w-full">
            <style
              dangerouslySetInnerHTML={{
                __html: `.${hover} { color: #c594c5 }`,
              }}
            />
            <p className="p-2 text-xl text-gray-200">Attack found</p>
            <div
              className="grid"
              style={{
                gridTemplateColumns: "auto 3em auto 1fr",
                alignSelf: "baseline",
              }}
            >
              <div className="pl-2 font-bold text-gray-200 border-t-2">
                From
              </div>
              <div className="font-bold text-gray-200 border-t-2"></div>
              <div className="font-bold text-gray-200 border-t-2">To</div>
              <div className="pr-2 font-bold text-gray-200 border-t-2">
                Messages
              </div>
              {parsed.attackTrace.map((t, i) => (
                <React.Fragment key={i}>
                  <div className="pl-2 border-t-2">
                    <OfmcMsg onHover={setHover} m={t.from} />
                  </div>
                  <div className="text-center border-t-2">
                    <Katex src="\rightarrow" />
                  </div>
                  <div className="pr-5 border-t-2">
                    <OfmcMsg onHover={setHover} m={t.to} />
                  </div>
                  <div className="flex flex-col pr-2 border-t-2">
                    {t.msgs.map((m) => (
                      <div
                        key={m}
                        style={{
                          wordBreak: "keep-all",
                          whiteSpace: "nowrap",
                        }}
                        className="mb-2"
                        title={m}
                      >
                        <OfmcMsg onHover={setHover} m={m} />
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <details>
              <summary className="text-gray-200 outline-none cursor-pointer select-none">
                Reached state:
              </summary>
              <div style={{ overflowY: "auto" }}>
                <pre style={{ fontSize: "0.8em", whiteSpace: "pre-wrap" }}>
                  {parsed.reachedState.map((r, i) => (
                    <p key={r} className="hover:bg-gray-200">
                      {r.substring(2)}
                    </p>
                  ))}
                </pre>
              </div>
            </details>
          </div>
        )}
      {result.stderr && (
        <div className="p-5">
          <p className="text-xl text-red-500">Error:</p>
          <pre style={{ fontSize: "0.8em", whiteSpace: "pre-wrap" }}>
            {result.stderr}
          </pre>
        </div>
      )}
    </>
  );
};
