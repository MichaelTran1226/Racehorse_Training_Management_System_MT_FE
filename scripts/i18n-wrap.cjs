// Bọc tr() quanh chữ giao diện trong JSX (song ngữ). Chạy: node scripts/i18n-wrap.cjs <file.tsx>...
// Chỉ đụng tới: chữ giữa thẻ JSX, thuộc tính chữ (title, placeholder, aria-label…) và chuỗi hiển thị
// trong {…} là con trực tiếp của thẻ. Chuỗi trong logic (so sánh, key, className…) không bị đổi.
const fs = require("fs");
const ts = require("typescript");

const dictSrc = fs.readFileSync(require("path").join(__dirname, "../src/shared/i18n/vi-text.ts"), "utf8");
const DICT = new Set();
for (const m of dictSrc.matchAll(/^\s+("(?:[^"\\]|\\.)*"):/gm)) DICT.add(JSON.parse(m[1]));

const TEXT_ATTRS = new Set([
  "title", "placeholder", "aria-label", "alt", "label", "description", "subtitle", "hint", "caption",
  "confirmLabel", "cancelLabel", "reasonHint", "blockedReason", "disabledReason", "header", "emptyText",
]);

const known = (s) => DICT.has(s) || DICT.has(s.trim());

function templatePattern(node) {
  // `a ${x} b` -> "a {{…}} b" (chỉ để biết có chữ hay không)
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  let out = node.head.text;
  for (const span of node.templateSpans) out += "{{v}}" + span.literal.text;
  return out;
}

function wrapFile(file) {
  const text = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];

  const wrapExpr = (node) => {
    // node là StringLiteral / template trong vị trí hiển thị
    if (ts.isStringLiteral(node)) {
      if (known(node.text)) edits.push([node.getStart(sf), node.getEnd(), `tr(${node.getText(sf)})`]);
    } else if (ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (/[A-Za-z]{2,}/.test(templatePattern(node).replace(/\{\{v\}\}/g, ""))) {
        edits.push([node.getStart(sf), node.getEnd(), `tr(${node.getText(sf)})`]);
      }
    } else if (ts.isConditionalExpression(node)) {
      wrapExpr(node.whenTrue);
      wrapExpr(node.whenFalse);
    } else if (ts.isBinaryExpression(node) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind)) {
      wrapExpr(node.right);
      if (node.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken) wrapExpr(node.left);
    } else if (ts.isParenthesizedExpression(node)) {
      wrapExpr(node.expression);
    }
  };

  const visit = (node) => {
    if (ts.isJsxText(node)) {
      const raw = node.getText(sf);
      const collapsed = raw.replace(/\s*\n\s*/g, " ").trim();
      if (collapsed && /[A-Za-z]/.test(collapsed) && known(collapsed)) {
        const lead = raw.match(/^\s*/)[0];
        const trail = raw.match(/\s*$/)[0];
        // JSX bỏ khoảng trắng có xuống dòng ở hai đầu; khoảng trắng cùng dòng thì giữ.
        const keepLead = lead.includes("\n") ? lead : lead ? lead + "" : "";
        const keepTrail = trail.includes("\n") ? trail : trail;
        const leadSpace = !lead.includes("\n") && lead.length ? "{\" \"}" : "";
        const trailSpace = !trail.includes("\n") && trail.length ? "{\" \"}" : "";
        edits.push([
          node.getStart(sf, false) - 0 + (raw.length - raw.length),
          node.getEnd(),
          (lead.includes("\n") ? keepLead : "") + leadSpace + `{tr(${JSON.stringify(collapsed)})}` + trailSpace + (trail.includes("\n") ? keepTrail : ""),
        ]);
      }
      return;
    }
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sf);
      if (TEXT_ATTRS.has(name) && node.initializer) {
        if (ts.isStringLiteral(node.initializer)) {
          if (known(node.initializer.text)) {
            edits.push([node.initializer.getStart(sf), node.initializer.getEnd(), `{tr(${JSON.stringify(node.initializer.text)})}`]);
          }
        } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          wrapExpr(node.initializer.expression);
        }
      }
      return; // không đi sâu vào thuộc tính khác (className, to, tone…)
    }
    if (ts.isJsxExpression(node) && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      wrapExpr(node.expression);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (!edits.length) return 0;

  // bỏ edit lồng nhau (giữ edit ngoài cùng)
  edits.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const kept = [];
  for (const e of edits) {
    const last = kept[kept.length - 1];
    if (last && e[0] < last[1]) continue;
    kept.push(e);
  }
  let out = text;
  for (const [s, e, r] of kept.reverse()) out = out.slice(0, s) + r + out.slice(e);
  if (!/import \{[^}]*\btr\b[^}]*\} from "@\/shared\/i18n\/tr"/.test(out)) {
    const imports = [...out.matchAll(/^import [\s\S]*?;\s*$/gm)];
    const at = imports.length ? imports[imports.length - 1].index + imports[imports.length - 1][0].length : 0;
    const nl = out.includes("\r\n") ? "\r\n" : "\n";
    out = out.slice(0, at) + nl + 'import { tr } from "@/shared/i18n/tr";' + out.slice(at);
  }
  fs.writeFileSync(file, out);
  return kept.length;
}

let total = 0;
for (const f of process.argv.slice(2)) {
  const n = wrapFile(f);
  total += n;
  if (n) console.log(String(n).padStart(4), f);
}
console.log("wrapped", total);
