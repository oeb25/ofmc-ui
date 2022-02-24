import * as React from "react";
import * as ofmc from "./ofmc";
import { Katex } from "./Katex";

const OfmcMsg: React.FC<{
  aliases: ofmc.Aliases;
  m: ofmc.Term;
  onHover: (name: string | null) => void;
  pretty: boolean;
}> = ({ aliases, m, onHover, pretty }) => {
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

  const latex = React.useMemo(
    () => ofmc.msgToLaTeX(m, aliases, { pretty }),
    [m, aliases, pretty]
  );

  return (
    <span onMouseMove={onMouseMove} onMouseLeave={() => setHover(null)}>
      <Katex src={latex} />
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

  const [aliases, setAliases] = React.useState<ofmc.Aliases>({});
  const [pretty, setPretty] = React.useState(true);

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
            <div className="flex justify-between p-2 text-xl text-gray-200">
              <span>Attack found</span>
              <label className="space-x-2 text-sm transition cursor-pointer select-none opacity-20 hover:opacity-100">
                <span>Pretty</span>
                <input
                  type="checkbox"
                  checked={pretty}
                  onChange={(e) => setPretty(e.target.checked)}
                />
              </label>
            </div>
            <div
              className="grid"
              style={{
                gridTemplateColumns: "auto 3em auto 1fr",
                alignSelf: "baseline",
              }}
            >
              <div className="pl-2 font-bold text-gray-200 border-t-2 border-slate-500">
                From
              </div>
              <div className="font-bold text-gray-200 border-t-2 border-slate-500"></div>
              <div className="font-bold text-gray-200 border-t-2 border-slate-500">
                To
              </div>
              <div className="pr-2 font-bold text-gray-200 border-t-2 border-slate-500">
                Messages
              </div>
              {parsed.attackTrace.map((t, i) => (
                <React.Fragment key={i}>
                  <div className="pt-1 pl-2 border-t-2 border-slate-700">
                    <OfmcMsg
                      onHover={setHover}
                      aliases={aliases}
                      pretty={pretty}
                      m={t.from}
                    />
                  </div>
                  <div className="pt-1 text-center border-t-2 border-slate-700">
                    <Katex src="\rightarrow" />
                  </div>
                  <div className="pt-1 pr-5 border-t-2 border-slate-700">
                    <OfmcMsg
                      onHover={setHover}
                      aliases={aliases}
                      pretty={pretty}
                      m={t.to}
                    />
                  </div>
                  <div className="flex flex-col pt-1 pr-2 border-t-2 border-slate-700">
                    {t.msgs.map((m, i) => (
                      <div
                        key={i}
                        style={{
                          wordBreak: "keep-all",
                          whiteSpace: "nowrap",
                        }}
                        className="mb-1"
                        title={ofmc.msgToPretty(m)}
                      >
                        <OfmcMsg
                          onHover={setHover}
                          aliases={aliases}
                          pretty={pretty}
                          m={m}
                        />
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <details>
              <summary className="font-bold text-gray-200 outline-none cursor-pointer select-none">
                Reached state:
              </summary>
              <div style={{ overflowY: "auto" }}>
                <pre style={{ fontSize: "0.8em", whiteSpace: "pre-wrap" }}>
                  {parsed.reachedState.map((r) => (
                    <p key={r} className="hover:bg-gray-800">
                      {r.substring(2)}
                    </p>
                  ))}
                </pre>
              </div>
            </details>
            <details className="overflow-visible">
              <summary className="font-bold text-gray-200 outline-none cursor-pointer select-none">
                Rename variables:
              </summary>
              <div className="flex flex-wrap">
                {allIdents(parsed)
                  .sort((a, b) =>
                    a == "i" ? -1 : b == "i" ? 1 : a < b ? 1 : -1
                  )
                  .map((ident) => (
                    <div
                      className="flex items-center p-2 m-1 rounded shadow bg-slate-800"
                      key={ident}
                      style={{ color: aliases[ident]?.color ?? "white" }}
                    >
                      <Katex src={`\\text{${ident}} := `} />
                      <input
                        className="w-12 ml-1 bg-transparent border-b border-slate-900"
                        value={aliases[ident]?.name ?? ""}
                        onChange={(e) =>
                          setAliases((a) => ({
                            ...a,
                            [ident]: { ...a[ident], name: e.target.value },
                          }))
                        }
                      />
                      <ColorPicker
                        value={aliases[ident]?.color ?? "white"}
                        onChange={(color) =>
                          setAliases((a) => ({
                            ...a,
                            [ident]: { ...a[ident], color },
                          }))
                        }
                      />
                    </div>
                  ))}
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

const allIdents = (parsed: ofmc.ParsedOfmc) =>
  Array.from(
    new Set(
      parsed.attackTrace?.flatMap((t) => [
        ...extractIdents(t.from),
        ...extractIdents(t.to),
        ...t.msgs.flatMap(extractIdents),
      ]) ?? []
    )
  );

const extractIdents = (msg: ofmc.Term): string[] => {
  switch (msg.type) {
    case "ident":
      return [msg.name];
    case "num":
      return [];
    case "tuple":
      return msg.msgs.flatMap(extractIdents);
    case "fun":
      return [msg.name, ...msg.args.flatMap(extractIdents)];
    case "sym":
    case "enc":
      return [...msg.msgs.flatMap(extractIdents), ...extractIdents(msg.key)];
  }
};

const useOnClickOutside = (handler: (e: MouseEvent | TouchEvent) => void) => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (!ref.current?.contains(e.target as Node)) handler(e);
    };

    document.addEventListener("click", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("click", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
  return { ref };
};

const ColorPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) => {
  const [show, setShow] = React.useState(false);

  const { ref } = useOnClickOutside(() => setShow(false));
  const [real, setReal] = React.useState(value);

  return (
    <div className="relative flex items-center">
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setShow((s) => !s);
        }}
        title="Pick Color"
        className="w-5 h-5 rounded-full"
        style={{ background: value }}
      />
      {show ? (
        <div
          className="z-10 overflow-hidden -translate-x-1/2 rounded shadow left-1/2 top-7 border-gray-200/50"
          style={{ position: "absolute", zIndex: 2 }}
        >
          <div
            ref={ref}
            className="grid w-32 grid-cols-5 shadow"
            onMouseLeave={() => onChange(real)}
          >
            {COLORS.map((c) => (
              <div
                className={`transition-all aspect-square hover:z-10 hover:shadow hover:border ${
                  c == real ? "border border-white/80" : "border-gray-200/50"
                }`}
                style={{ background: c }}
                onClick={() => {
                  onChange(c);
                  setReal(c);
                  setShow(false);
                }}
                onMouseEnter={() => onChange(c)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const COLORS = [
  "#D8DEE9",
  "#99C794",
  "#5FB3B3",
  "#6699CC",
  "#65737E",
  "#FAC863",
  "#F99157",
  "#EB606B",
  "#BB80B3",
  "#AB7967",
];
