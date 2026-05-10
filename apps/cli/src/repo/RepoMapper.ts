import { readFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";
import TypeScript from "tree-sitter-typescript";
import type { ContextMap, ContextSymbol } from "../types.js";

const SUPPORTED_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);
const IGNORE_PARTS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage"
]);

export class RepoMapper {
  constructor(private readonly root = process.cwd()) {}

  async map(files: string[]): Promise<ContextMap> {
    const root = resolve(this.root);

    const mapped = await Promise.all(
      files
        .filter((file) => SUPPORTED_EXTENSIONS.has(extname(file)))
        .filter(
          (file) =>
            !relative(root, resolve(file))
              .split("/")
              .some((part) => IGNORE_PARTS.has(part))
        )
        .map(async (file) => {
          const parser = new Parser();
          const extension = extname(file);
          const language = (
            extension === ".ts" || extension === ".tsx"
              ? TypeScript.typescript
              : JavaScript
          ) as unknown as Parser.Language;
          parser.setLanguage(language);
          const source = await readFile(file, "utf8");
          const tree = parser.parse(source);

          return {
            path: relative(root, resolve(file)),
            language: extension.slice(1),
            symbols: this.extractSymbols(
              tree.rootNode,
              source,
              relative(root, resolve(file))
            )
          };
        })
    );

    return {
      root,
      generatedAt: new Date().toISOString(),
      files: mapped
    };
  }

  summarize(contextMap: ContextMap): string {
    return JSON.stringify(contextMap, null, 2);
  }

  private extractSymbols(
    rootNode: Parser.SyntaxNode,
    source: string,
    file: string
  ): ContextSymbol[] {
    const symbols: ContextSymbol[] = [];

    rootNode.descendantsOfType([
      "export_statement",
      "function_declaration",
      "class_declaration",
      "interface_declaration",
      "type_alias_declaration",
      "lexical_declaration"
    ]).forEach((node) => {
      const symbol = this.symbolFromNode(node, source, file);
      if (symbol) {
        symbols.push(symbol);
      }
    });

    return symbols;
  }

  private symbolFromNode(
    node: Parser.SyntaxNode,
    source: string,
    file: string
  ): ContextSymbol | undefined {
    const text = source.slice(node.startIndex, node.endIndex);
    const line = node.startPosition.row + 1;

    if (node.type === "class_declaration") {
      return this.named(text, /class\s+([A-Za-z0-9_$]+)/, "class", file, line);
    }

    if (node.type === "function_declaration") {
      return this.named(
        text,
        /function\s+([A-Za-z0-9_$]+)/,
        "function",
        file,
        line
      );
    }

    if (node.type === "interface_declaration") {
      return this.named(
        text,
        /interface\s+([A-Za-z0-9_$]+)/,
        "interface",
        file,
        line
      );
    }

    if (node.type === "type_alias_declaration") {
      return this.named(text, /type\s+([A-Za-z0-9_$]+)/, "type", file, line);
    }

    if (node.type === "lexical_declaration" && text.includes("export")) {
      return this.named(
        text,
        /(const|let|var)\s+([A-Za-z0-9_$]+)/,
        "variable",
        file,
        line,
        2
      );
    }

    if (node.type === "export_statement") {
      const match = text.match(
        /export\s+(?:default\s+)?(?:async\s+)?(?:class|function|const|let|var|type|interface)?\s*([A-Za-z0-9_$]+)?/
      );
      return {
        name: match?.[1] ?? "anonymous_export",
        kind: "export",
        file,
        line
      };
    }

    return undefined;
  }

  private named(
    text: string,
    pattern: RegExp,
    kind: ContextSymbol["kind"],
    file: string,
    line: number,
    group = 1
  ): ContextSymbol | undefined {
    const match = text.match(pattern);
    if (!match?.[group]) {
      return undefined;
    }

    return {
      name: match[group],
      kind,
      file,
      line
    };
  }
}
