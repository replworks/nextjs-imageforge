import { parse, type ParserPlugin } from "@babel/parser";
import { parseDsl } from "./dsl-parser.js";
import type { UrlSettings } from "./settings-access.js";
import { imageForgeWithSettings } from "./url-api.js";

export interface TransformSettings extends UrlSettings {
  prefix: string;
}

interface SyntaxNode {
  type: string;
  start: number;
  end: number;
  [key: string]: unknown;
}

interface JsxAttribute extends SyntaxNode {
  name: SyntaxNode & { name?: unknown };
  value: (SyntaxNode & { value?: unknown }) | null;
}

interface Edit {
  start: number;
  end: number;
  text: string;
}

const IMAGE_MODULE = "next/image";

function isNode(value: unknown): value is SyntaxNode {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { type?: unknown }).type === "string"
  );
}

function visit(node: SyntaxNode, callback: (node: SyntaxNode) => void): void {
  callback(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) {
        if (isNode(child)) {
          visit(child, callback);
        }
      }
    } else if (isNode(value)) {
      visit(value, callback);
    }
  }
}

function imageLocalNames(body: SyntaxNode[]): Set<string> {
  const names = new Set<string>();
  for (const statement of body) {
    if (
      statement.type !== "ImportDeclaration" ||
      statement.importKind === "type" ||
      (statement.source as { value?: unknown }).value !== IMAGE_MODULE
    ) {
      continue;
    }

    for (const specifier of statement.specifiers as SyntaxNode[]) {
      const local = (specifier.local as { name: string }).name;
      const imported = specifier.imported as
        { name?: string; value?: string } | undefined;
      const isDefault =
        specifier.type === "ImportDefaultSpecifier" ||
        (specifier.type === "ImportSpecifier" &&
          specifier.importKind !== "type" &&
          (imported?.name ?? imported?.value) === "default");
      if (isDefault) {
        names.add(local);
      }
    }
  }
  return names;
}

function findAttribute(
  attributes: SyntaxNode[],
  name: string,
): JsxAttribute | undefined {
  return attributes.find(
    (attribute): attribute is JsxAttribute =>
      attribute.type === "JSXAttribute" &&
      (attribute as JsxAttribute).name.type === "JSXIdentifier" &&
      (attribute as JsxAttribute).name.name === name,
  );
}

function stringLiteral(attribute: JsxAttribute | undefined) {
  return attribute?.value?.type === "StringLiteral"
    ? attribute.value
    : undefined;
}

function elementEdits(
  source: string,
  element: SyntaxNode,
  imageNames: Set<string>,
  settings: TransformSettings,
): Edit[] {
  const attributes = element.attributes as SyntaxNode[];
  const classAttribute = findAttribute(attributes, "className");
  const classValue = stringLiteral(classAttribute);
  if (!classAttribute || !classValue) {
    return [];
  }

  const quote = source[classValue.start];
  const rawClass = source.slice(classValue.start + 1, classValue.end - 1);
  const { options, consumed } = parseDsl(rawClass, settings.prefix);
  if (consumed.length === 0) {
    return [];
  }

  const edits: Edit[] = [];
  const consumedTokens = new Set(consumed);
  const remaining = rawClass
    .split(/\s+/)
    .filter((word) => word !== "" && !consumedTokens.has(word));

  if (remaining.length > 0) {
    edits.push({
      start: classAttribute.start,
      end: classAttribute.end,
      text: `className=${quote}${remaining.join(" ")}${quote}`,
    });
  } else {
    let start = classAttribute.start;
    while (start > 0 && /\s/.test(source[start - 1])) {
      start -= 1;
    }
    edits.push({ start, end: classAttribute.end, text: "" });
  }

  const srcAttribute = findAttribute(attributes, "src");
  const srcValue = stringLiteral(srcAttribute);
  if (
    srcAttribute &&
    srcValue &&
    typeof srcValue.value === "string" &&
    /^\/(?!\/)/.test(srcValue.value)
  ) {
    const srcQuote = source[srcValue.start];
    const rawSrc = source.slice(srcValue.start + 1, srcValue.end - 1);
    const url = imageForgeWithSettings(rawSrc, options, settings);
    const elementName = element.name as SyntaxNode & { name?: unknown };
    const addUnoptimized =
      elementName.type === "JSXIdentifier" &&
      imageNames.has(elementName.name as string) &&
      !findAttribute(attributes, "unoptimized");

    edits.push({
      start: srcAttribute.start,
      end: srcAttribute.end,
      text: `src=${srcQuote}${url}${srcQuote}${addUnoptimized ? " unoptimized" : ""}`,
    });
  }

  return edits;
}

export function transformJsx(
  source: string,
  filename: string,
  settings: TransformSettings,
): string {
  if (!source.includes(settings.prefix)) {
    return source;
  }

  const plugins: ParserPlugin[] = filename.endsWith(".tsx")
    ? ["jsx", "typescript"]
    : ["jsx"];
  const program = parse(source, { sourceType: "module", plugins })
    .program as unknown as SyntaxNode;
  const imageNames = imageLocalNames(program.body as SyntaxNode[]);

  const edits: Edit[] = [];
  visit(program, (node) => {
    if (node.type === "JSXOpeningElement") {
      edits.push(...elementEdits(source, node, imageNames, settings));
    }
  });

  if (edits.length === 0) {
    return source;
  }

  edits.sort((a, b) => b.start - a.start);
  let output = source;
  for (const edit of edits) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }
  return output;
}
