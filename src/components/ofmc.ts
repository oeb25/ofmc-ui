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

const parseTrace = (trace: string) => {
  const from = trace.substring(0, trace.indexOf(" -> "));
  const to = trace.substring(trace.indexOf(" -> ") + 4, trace.indexOf(": "));

  const msgsRaw = trace.substring(trace.indexOf(": ") + 2);

  const msgs = [];

  let depth = 0;
  let last = 0;

  for (let i = 0; i < msgsRaw.length; i++) {
    let c = msgsRaw[i];
    // We don't care which type of bracket we see, since we assume the message to be well formed.
    if (c == "(" || c == "{" || c == "[") {
      depth += 1;
    } else if (c == ")" || c == "}" || c == "]") {
      depth -= 1;
    } else if (depth == 0 && c == ",") {
      msgs.push(msgsRaw.substring(last, i));
      last = i + 1;
    }
  }
  msgs.push(msgsRaw.substring(last));

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

const findEndOfExpr = (msg: string, i: number) => {
  let depth = 0;
  let any = false;

  for (; i < msg.length; i++) {
    let c = msg[i];
    // We don't care which type of bracket we see, since we assume the message to be well formed.
    if (c == "(" || c == "{" || c == "[") {
      any = true;
      depth += 1;
    } else if (c == ")" || c == "}" || c == "]") {
      depth -= 1;
    } else if (depth == 0 && any) {
      return i;
    }
  }

  return i;
};

const replaceAll = (x: string, pat: RegExp, res: string): string =>
  (x as any).replaceAll(pat, res);

export const msgToLatex = (msg: string) => {
  let msg2 = msg
    .replace(/exp\(/g, "\\exp(")
    .replace(/{/g, "\\left\\{")
    .replace(/\\left\\{\|/g, "\\left\\{\\left|")
    .replace(/}/g, "\\right\\}")
    .replace(/\|\\right\\}/g, "\\right|\\right\\}")
    .replace(/pk\(/g, "\\htmlStyle{color: maroon;}{pk}(");

  let last = 0;
  let current = 0;

  while ((current = msg2.indexOf("_", last)) >= 0) {
    last = current + 1;
    const end = findEndOfExpr(msg2, current);
    msg2 = msg2.replace(
      msg2.slice(current, end),
      `_\{${msg2.slice(current + 1, end)}\}`
    );
  }

  return replaceAll(msg2, /x(\d+)/g, "\\htmlClass{ident-x-$1}{x_{$1}}");
};
