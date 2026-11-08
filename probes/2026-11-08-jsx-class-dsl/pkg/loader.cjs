const { parse } = require("@babel/parser");
const fs = require("node:fs");
function walk(node, visit) {
  if (!node || typeof node.type !== "string") return;
  visit(node);
  for (const key of Object.keys(node)) {
    const v = node[key];
    if (Array.isArray(v)) v.forEach((c) => c && typeof c.type === "string" && walk(c, visit));
    else if (v && typeof v.type === "string") walk(v, visit);
  }
}
module.exports = function (source) {
  const opts = this.getOptions ? this.getOptions() : {};
  fs.appendFileSync(process.env.PROBE_LOG, `${process.env.NEXT_PROBE_BUNDLER || "?"} ${this.resourcePath}\n`);
  if (!source.includes("if-")) return source;
  const ast = parse(source, { sourceType: "module", plugins: ["jsx", "typescript"] });
  let imageLocal = null;
  for (const s of ast.program.body)
    if (s.type === "ImportDeclaration" && s.source.value === "next/image")
      for (const sp of s.specifiers) if (sp.type === "ImportDefaultSpecifier") imageLocal = sp.local.name;
  const edits = [];
  walk(ast.program, (n) => {
    if (n.type !== "JSXOpeningElement") return;
    const attr = (name) => n.attributes.find((a) => a.type === "JSXAttribute" && a.name.name === name);
    const cls = attr("className"), src = attr("src");
    if (!cls || cls.value?.type !== "StringLiteral") return;
    const words = cls.value.value.split(/\s+/).filter(Boolean);
    const q = []; const rest = [];
    for (const w of words) {
      let m;
      if ((m = /^if-w-(\d+)$/.exec(w))) q.push(`w=${m[1]}`);
      else if (w === "if-webp") q.push("f=webp");
      else rest.push(w);
    }
    if (!q.length) return;
    if (!q.some((x) => x.startsWith("w="))) q.unshift("w=0");
    edits.push([cls.start, cls.end, rest.length ? `className="${rest.join(" ")}"` : ""]);
    if (src && src.value?.type === "StringLiteral" && /^\/(?!\/)/.test(src.value.value)) {
      const url = `${opts.baseUrl}/${opts.service}${opts.basePath}${src.value.value}?${q.join("&")}`;
      edits.push([src.start, src.end, `src="${url}"`]);
      const name = n.name.type === "JSXIdentifier" ? n.name.name : null;
      if (name && name === imageLocal && !attr("unoptimized")) edits.push([n.name.end, n.name.end, " unoptimized"]);
    }
  });
  edits.sort((a, b) => b[0] - a[0]);
  let out = source;
  for (const [s, e, t] of edits) out = out.slice(0, s) + t + out.slice(e);
  return out;
};
