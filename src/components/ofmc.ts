import * as React from "react";

export const SAMPLE = `Protocol: TLS_1_3

# Very simplified model

Types: Agent A,B,s;
       Number NA,NB,X,Y;
       Function pk,clientK,serverK,kdf,h,mac,data,pw

Knowledge:
    A: A,B,pk(A),pk(s),inv(pk(A)),{A,pk(A)}inv(pk(s)),clientK,serverK,kdf,g,h,mac,data,pw(A,B);
    B: A,B,pk(B),pk(s),inv(pk(B)),{B,pk(B)}inv(pk(s)),clientK,serverK,kdf,g,h,mac,data,pw(A,B)

Actions:

A->B:
  # Client Hello
  A,exp(g,X)
B->A:
  # Server Hello
  exp(g,Y)
  # k1 := clientK(exp(exp(g,X),Y))
  # k2 := serverK(exp(exp(g,X),Y))
  # Server Certificate {| {B,pk(B)}inv(pk(s)) |}k2
  , {| {B,pk(B)}inv(pk(s)) |}  serverK(exp(exp(g,X),Y))
  # Server Certificate Verification / Finished {| {h(exp(g,X),exp(g,Y))}inv(pk(B)) |}k2
  , {| {h(exp(g,X),exp(g,Y))}inv(pk(B)) |}serverK(exp(exp(g,X),Y))
A->B:
  # Client Finished {|h(exp(g,X),exp(g,Y))|}k1
  {|h(exp(g,X),exp(g,Y))|}clientK(exp(exp(g,X),Y))
  # Client send Data  {| DATA_A |}k1
  , {| data,DATAA,pw(A,B) |}clientK(exp(exp(g,X),Y))
B->A:
  # Server send Data {| DATA_B |}k2
  {| data,DATAB |}serverK(exp(exp(g,X),Y))


Goals:

  B authenticates A on DATAA
  A authenticates B on DATAB
  DATAA secret between A,B
  DATAB secret between A,B
`;

export const SAMPLE_OUTPUT = `Open-Source Fixedpoint Model-Checker version 2020
INPUT:
   /Users/oeb25/Projects/scrap/ofmc-ui/temp/ofmc-uiAMo6qv/5588444030986954.AnB
SUMMARY:
  ATTACK_FOUND
GOAL:
  weak_auth
BACKEND:
  Open-Source Fixedpoint Model-Checker version 2020
STATISTICS:
  TIME 2102 ms
  parseTime 1 ms
  visitedNodes: 3 nodes
  depth: 1 plies

ATTACK TRACE:
i -> (x401,1): x402,g
(x401,1) -> i: exp(g,Y(1)),{|{x401,pk(x401)}_inv(pk(s))|}_(serverK(exp(g,Y(1)))),{|{h(g,exp(g,Y(1)))}_inv(pk(x401))|}_(serverK(exp(g,Y(1))))
i -> (x401,1): {|h(g,exp(g,Y(1)))|}_(clientK(exp(g,Y(1)))),{|data,x404|}_(clientK(exp(g,Y(1))))
(x401,1) -> i: {|data,DATAB(2)|}_(serverK(exp(g,Y(1))))


% Reached State:
%
% request(x401,x402,pBADATAA,x404,1)
% state_rB(x401,2,data,mac,h,g,kdf,serverK,clientK,{x401,pk(x401)}_inv(pk(s)),inv(pk(x401)),pk(s),pk(x401),x402,g,x402,g,Y(1),exp(g,Y(1)),{|{x401,pk(x401)}_inv(pk(s))|}_(serverK(exp(g,Y(1)))),{|{h(g,exp(g,Y(1)))}_inv(pk(x401))|}_(serverK(exp(g,Y(1)))),{|{h(g,exp(g,Y(1)))}_inv(pk(x401))|}_(serverK(exp(g,Y(1)))),{|{x401,pk(x401)}_inv(pk(s))|}_(serverK(exp(g,Y(1)))),exp(g,Y(1)),x404,{|data,x404|}_(clientK(exp(g,Y(1)))),{|h(g,exp(g,Y(1)))|}_(clientK(exp(g,Y(1)))),{|h(g,exp(g,Y(1)))|}_(clientK(exp(g,Y(1)))),{|data,x404|}_(clientK(exp(g,Y(1)))),DATAB(2),{|data,DATAB(2)|}_(serverK(exp(g,Y(1)))),1)
% witness(x401,x402,pABDATAB,DATAB(2))
% secrets(x404,secrecyset(x401,1,pDATAA),i)
% contains(secrecyset(x401,1,pDATAA),x402)
% contains(secrecyset(x401,1,pDATAA),x401)
% secrets(DATAB(2),secrecyset(x401,1,pDATAB),i)
% contains(secrecyset(x401,1,pDATAB),x402)
% contains(secrecyset(x401,1,pDATAB),x401)
% state_rA(x20,0,data,mac,h,g,kdf,serverK,clientK,x30,{x20,pk(x20)}_inv(pk(s)),inv(pk(x20)),pk(s),pk(x20),1)

`;

const SAMPLE2 = `Protocol: Test

Types: Agent A,B,s;
       Number NA,NB;
       Symmetric_key KAB;
       Function sk

Knowledge:
    A: A,B,s,sk(A,s);
    B: A,B,s,sk(B,s);
    s: A,B,s,sk(A,s),sk(B,s)

Actions:
  B->A: B,A,NB
  A->s: {| A,B,NA,NB |}sk(A,s)
  s->A: {| A,B,KAB,NA, {| A,B,KAB,NA,NB |}sk(B,s) |}sk(A,s)
  A->B: {| A,B,KAB,NA,NB |}sk(B,s)

Goals:
  A authenticates s on KAB,B
  B authenticates s on KAB,A
  KAB secret between A,B,s
`;

type Token =
  | { type: "ident"; name: string }
  | { type: "lsym" }
  | { type: "rsym" }
  | { type: "lenc" }
  | { type: "renc" }
  | { type: "lparen" }
  | { type: "rparen" }
  | { type: "_" }
  | { type: "comma" }
  | { type: "number"; value: number };
const tokenizeMsg = (src: string): Token[] => {
  const tokens: Token[] = [];
  let res: RegExpMatchArray | null = null;

  while (src.length > 0) {
    if ((res = src.match(/^[a-zA-Z][a-zA-Z0-9_]*/))) {
      tokens.push({ type: "ident", name: res[0] });
    } else if ((res = src.match(/^{\|/))) {
      tokens.push({ type: "lsym" });
    } else if ((res = src.match(/^\|}/))) {
      tokens.push({ type: "rsym" });
    } else if ((res = src.match(/^{/))) {
      tokens.push({ type: "lenc" });
    } else if ((res = src.match(/^}/))) {
      tokens.push({ type: "renc" });
    } else if ((res = src.match(/^\(/))) {
      tokens.push({ type: "lparen" });
    } else if ((res = src.match(/^\)/))) {
      tokens.push({ type: "rparen" });
    } else if ((res = src.match(/^_/))) {
      tokens.push({ type: "_" });
    } else if ((res = src.match(/^,/))) {
      tokens.push({ type: "comma" });
    } else if ((res = src.match(/^\d+/))) {
      tokens.push({ type: "number", value: parseInt(res[0]) });
    }
    if (!res) break;
    src = src.substring(res[0].length);
  }

  return tokens;
};

const see = (tokens: Token[], ty: Token["type"]) => tokens[0]?.type == ty;
const have = <K extends Token["type"]>(tokens: Token[], ty: K) => {
  if (see(tokens, ty)) {
    return tokens.splice(0, 1)[0] as Token extends infer T
      ? T extends { type: K }
        ? T
        : never
      : never;
  }
};
const mustHave = <K extends Token["type"]>(tokens: Token[], ty: K) => {
  if (see(tokens, ty)) {
    return tokens.splice(0, 1)[0] as Token extends infer T
      ? T extends { type: K }
        ? T
        : never
      : never;
  }
  throw new Error(`Parse error: Expected ${ty} at ${JSON.stringify(tokens)}`);
};

export type Term =
  | { type: "num"; value: number }
  | { type: "ident"; name: string }
  | { type: "fun"; name: string; args: Term[] }
  | { type: "tuple"; msgs: Term[] }
  | {
      type: "sym";
      msgs: Term[];
      key: Term;
    }
  | {
      type: "enc";
      msgs: Term[];
      key: Term;
    };

const comma = (tokens: Token[]): Term[] => {
  const msgs: Term[] = [];
  do {
    msgs.push(parseMsg(tokens));
  } while (have(tokens, "comma"));
  return msgs;
};
const parseMsg = (tokens: Token[]): Term => {
  let x;
  if ((x = have(tokens, "number"))) {
    return { type: "num", value: x.value };
  } else if ((x = have(tokens, "ident"))) {
    const name = x.name;
    if ((x = have(tokens, "lparen"))) {
      const args = comma(tokens);
      mustHave(tokens, "rparen");
      return { type: "fun", name, args };
    } else {
      return { type: "ident", name };
    }
  } else if ((x = have(tokens, "lsym"))) {
    const msgs = comma(tokens);
    mustHave(tokens, "rsym");
    mustHave(tokens, "_");
    const key = parseMsg(tokens);
    return { type: "sym", msgs, key };
  } else if ((x = have(tokens, "lenc"))) {
    const msgs = comma(tokens);
    mustHave(tokens, "renc");
    mustHave(tokens, "_");
    const key = parseMsg(tokens);
    return { type: "enc", msgs, key };
  } else if ((x = have(tokens, "lparen"))) {
    const inner = parseMsg(tokens);
    mustHave(tokens, "rparen");

    return inner;
  }

  throw new Error("parse error: " + JSON.stringify(tokens));
};

export const msgToPretty = (term: Term): string => {
  switch (term.type) {
    case "ident":
      return term.name;
    case "num":
      return term.value.toString();
    case "tuple":
      return `(${term.msgs.map(msgToPretty).join(", ")})`;
    case "fun":
      return `${term.name}(${term.args.map(msgToPretty).join(", ")})`;
    case "sym":
      return `{| ${term.msgs.map(msgToPretty).join(", ")} |}${msgToPretty(
        term.key
      )}`;
    case "enc":
      return `{ ${term.msgs.map(msgToPretty).join(", ")} }${msgToPretty(
        term.key
      )}`;
  }
};

export type Aliases = Record<string, { name?: string; color?: string } | void>;
export const msgToLaTeX = (
  msg: Term,
  aliases: Aliases,
  opts: { pretty?: boolean }
): string => {
  switch (msg.type) {
    case "ident": {
      const name = aliases[msg.name]?.name || msg.name;
      const color = aliases[msg.name]?.color;
      return `\\text{${
        color ? `\\htmlStyle{color: ${color};}{${name}}` : name
      }}`;
    }
    case "num":
      return msg.value.toString();
    case "tuple":
      if (opts.pretty && msg.msgs.length == 2 && msg.msgs[1].type == "num")
        return (
          msgToLaTeX(msg.msgs[0], aliases, opts) + `^{${msg.msgs[1].value}}`
        );
      return `\\left(${msg.msgs
        .map((m) => msgToLaTeX(m, aliases, opts))
        .join(", ")}\\right)`;
    case "fun":
      if (opts.pretty && msg.args.length == 1 && msg.args[0].type == "num")
        return (
          msgToLaTeX({ type: "ident", name: msg.name }, aliases, opts) +
          `_{${msg.args[0].value}}`
        );
      const color = msg.name == "inv" ? "lightblue" : aliases[msg.name]?.color;
      const name = `\\htmlStyle{color: ${color};}{${msg.name}}`;
      return `\\text{${name}}(${msg.args
        .map((m) => msgToLaTeX(m, aliases, opts))
        .join(", ")})`;
    case "sym":
      return `\\left\\{\\!\\!\\left|${msg.msgs
        .map((m) => msgToLaTeX(m, aliases, opts))
        .join(", ")}\\right|\\!\\!\\right\\}_{${msgToLaTeX(
        msg.key,
        aliases,
        opts
      )}}`;
    case "enc":
      return `\\left\\{${msg.msgs
        .map((m) => msgToLaTeX(m, aliases, opts))
        .join(", ")}\\right\\}_{${msgToLaTeX(msg.key, aliases, opts)}}`;
  }
};

const parseActor = (actor: string): Term => {
  const tokens = tokenizeMsg(actor);
  if (have(tokens, "lparen")) {
    const msgs = comma(tokens);
    mustHave(tokens, "rparen");
    return { type: "tuple", msgs };
  }
  return parseMsg(tokens);
};

const parseTrace = (trace: string) => {
  const from = parseActor(trace.substring(0, trace.indexOf(" -> ")));
  const to = parseActor(
    trace.substring(trace.indexOf(" -> ") + 4, trace.indexOf(": "))
  );

  const msgsRaw = trace.substring(trace.indexOf(": ") + 2);
  const msgs = comma(tokenizeMsg(msgsRaw));

  return { from, to, msgs };
};

export const parseOfmc = (src: string) => {
  const lines = src.split("\n").filter((x) => x.trim().length > 0);

  const startInput = lines.indexOf("INPUT:");
  const startSummary = lines.indexOf("SUMMARY:");
  const startGoal = lines.indexOf("GOAL:");
  const startDetails = lines.indexOf("DETAILS:");
  const startBackend = lines.indexOf("BACKEND:");
  const startStatistics = lines.indexOf("STATISTICS:");
  const startAttackTrace = lines.indexOf("ATTACK TRACE:");
  const startReachedState = lines.indexOf("% Reached State:");

  const attackFound = startAttackTrace >= 0;

  const input = lines[startInput + 1].trim();
  const summary = lines[startSummary + 1].trim();
  const goal = lines[startGoal + 1].trim();
  const details = lines[startDetails + 1].trim();
  const backend = lines[startBackend + 1].trim();
  const statistics = lines
    .slice(startStatistics + 1, attackFound ? startAttackTrace : src.length)
    .map((x) => x.trim());
  const attackTrace = attackFound
    ? lines.slice(startAttackTrace + 1, startReachedState).map(parseTrace)
    : null;
  const reachedState = lines.slice(startReachedState + 2);

  return {
    summary,
    input,
    goal,
    details,
    backend,
    statistics,
    attackTrace,
    reachedState,
  };
};

export type ParsedOfmc = ReturnType<typeof parseOfmc>;

export type Status = "IDLE" | "WAITING" | "ANALYZING";

export const useOfmc = () => {
  const [status, setStatus] = React.useState<Status>("IDLE");
  const [source, setSource] = React.useState(SAMPLE);
  const debounce = React.useRef({
    timeout: 0,
    controller: null as AbortController | null,
  });
  const [result, setResult] = React.useState<null | {
    err: string;
    stdout: string;
    stderr: string;
  }>(null);

  React.useEffect(() => {
    if (!source) return;

    setStatus("WAITING");

    clearTimeout(debounce.current.timeout);
    if (debounce.current.controller) {
      debounce.current.controller.abort();
    }

    const controller = new AbortController();

    debounce.current = {
      timeout: window.setTimeout(() => {
        setStatus("ANALYZING");
        fetch("http://localhost:8080/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ source }),
        })
          .then(async (res) => {
            const r = await res.json();
            setResult(r);
          })
          .catch((e) => {
            console.error("fetch:", e);
          })
          .finally(() => {
            setStatus("IDLE");
          });
      }, 200),
      controller,
    };
  }, [source]);

  return { status, source, setSource, result };
};
