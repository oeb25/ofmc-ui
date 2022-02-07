import * as monaco from "monaco-editor";

export const id = "AnB";

const keywords =
  "Protocol|Types|Agent|Number|Function|Symmetric_key|PublicKey|Knowledge|where|Actions|Goals|authenticates|on|secrecy|of|secret|between".split(
    "|"
  );

monaco.languages.register({
  id,
  extensions: [".AnB", ".anb"],
  aliases: ["anb"],
  mimetypes: ["application/anb"],
});

monaco.languages.setLanguageConfiguration(id, {
  comments: { lineComment: "#" },
  brackets: [
    ["{|", "|}"],
    ["{", "}"],
    ["(", ")"],
  ],
});
monaco.languages.setMonarchTokensProvider(id, {
  keywords,
  tokenizer: {
    root: [
      [/#.+$/, "comment"],
      [/exp|inv/, "builtinfunctions"],
      [
        /(Protocol|Types|Agent|Number|Function|Symmetric_key|PublicKey|Knowledge|where|Actions|Goals|authenticates|on|secrecy|of|secret|between)/,
        "keyword",
      ],
      [/[a-z][a-zA-Z0-9_]*/, "constant"],
      [/\b[A-Z_][a-zA-Z0-9_]*/, "identifier"],
      [/->/, "operator"],
    ],
  },
});

// Register a completion item provider for the new language
// monaco.languages.registerCompletionItemProvider(id, {
//   provideCompletionItems: () => {
//     var suggestions = [
//       //   {
//       //     label: "simpleText",
//       //     kind: monaco.languages.CompletionItemKind.Text,
//       //     insertText: "simpleText",
//       //   },
//       //   {
//       //     label: "testing",
//       //     kind: monaco.languages.CompletionItemKind.Keyword,
//       //     insertText: "testing(${1:condition})",
//       //     insertTextRules:
//       //       monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
//       //   },
//       //   {
//       //     label: "ifelse",
//       //     kind: monaco.languages.CompletionItemKind.Snippet,
//       //     insertText: [
//       //       "if (${1:condition}) {",
//       //       "\t$0",
//       //       "} else {",
//       //       "\t",
//       //       "}",
//       //     ].join("\n"),
//       //     insertTextRules:
//       //       monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
//       //     documentation: "If-Else Statement",
//       //   },
//       //   ...keywords.map((kw) => ({
//       //     label: kw,
//       //     kind: monaco.languages.CompletionItemKind.Keyword,
//       //     insertText: kw,
//       //   })),
//     ];
//     return { suggestions: suggestions };
//   },
// });
