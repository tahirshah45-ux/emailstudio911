import { BRAND, FONT_STACK } from "@/lib/brand";

/**
 * Transforms rich-text editor HTML (TipTap output) into email-client-safe
 * HTML with fully inline CSS. Every supported node type is mapped to a
 * table-based / inline-styled equivalent so the result renders correctly
 * in Gmail, Outlook, Apple Mail, and other major clients.
 */

const P_STYLE = `margin:0 0 16px 0; font-family:${FONT_STACK}; font-size:15px; line-height:24px; color:${BRAND.body};`;
const H2_STYLE = `margin:0; font-family:${FONT_STACK}; font-size:17px; line-height:24px; font-weight:700; color:${BRAND.heading}; padding:10px 0 12px 0;`;
const H3_STYLE = `margin:0; font-family:${FONT_STACK}; font-size:12px; line-height:18px; font-weight:700; letter-spacing:1px; color:${BRAND.label}; text-transform:uppercase; padding:8px 0 8px 0;`;
const LINK_STYLE = `color:${BRAND.goldDark}; font-weight:600; text-decoration:underline;`;
const TD_STYLE = `border:1px solid ${BRAND.border}; padding:9px 12px; font-family:${FONT_STACK}; font-size:14px; line-height:21px; color:${BRAND.body}; text-align:left; vertical-align:top;`;
const TH_STYLE = `border:1px solid ${BRAND.border}; padding:9px 12px; font-family:${FONT_STACK}; font-size:13px; line-height:20px; font-weight:700; color:${BRAND.heading}; background-color:${BRAND.cardBg}; text-align:left; vertical-align:top;`;

function serializeChildren(node: Node): string {
  let out = "";
  node.childNodes.forEach((child) => (out += serializeNode(child)));
  return out;
}

function escapeText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function checklistRow(checked: boolean, inner: string): string {
  const box = checked
    ? `<td width="18" height="18" align="center" style="width:18px; height:18px; background-color:${BRAND.gold}; border:2px solid ${BRAND.gold}; border-radius:4px; font-family:Arial, sans-serif; font-size:12px; line-height:18px; font-weight:bold; color:${BRAND.black};">&#10003;</td>`
    : `<td width="18" height="18" align="center" style="width:18px; height:18px; border:2px solid #D1D5DB; border-radius:4px; font-size:12px; line-height:18px;">&nbsp;</td>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="30" valign="top" style="padding:9px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${box}</tr></table></td>
<td valign="top" style="padding:9px 0; font-family:${FONT_STACK}; font-size:14px; line-height:22px; color:${BRAND.body}; border-bottom:1px solid ${BRAND.divider};">${inner}</td>
</tr></table>`;
}

function bulletRow(inner: string, marker: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="24" valign="top" style="font-family:Arial, sans-serif; font-size:14px; line-height:24px; color:${BRAND.gold}; font-weight:bold;">${marker}</td>
<td valign="top" style="font-family:${FONT_STACK}; font-size:14px; line-height:24px; color:${BRAND.body}; padding-bottom:6px;">${inner}</td>
</tr></table>`;
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeText(node.textContent ?? "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case "p": {
      const inner = serializeChildren(el);
      if (!inner.trim()) return `<div style="line-height:10px; font-size:10px;">&nbsp;</div>`;
      return `<p style="${P_STYLE}">${inner}</p>`;
    }
    case "h1":
    case "h2":
      return `<div style="${H2_STYLE}">${serializeChildren(el)}</div>`;
    case "h3":
    case "h4":
      return `<div style="${H3_STYLE}">${serializeChildren(el)}</div>`;
    case "strong":
    case "b":
      return `<strong style="font-weight:700; color:${BRAND.heading};">${serializeChildren(el)}</strong>`;
    case "em":
    case "i":
      return `<em>${serializeChildren(el)}</em>`;
    case "u":
      return `<span style="text-decoration:underline;">${serializeChildren(el)}</span>`;
    case "s":
    case "del":
      return `<span style="text-decoration:line-through;">${serializeChildren(el)}</span>`;
    case "code":
      return `<span style="font-family:Consolas, Menlo, monospace; font-size:13px; background-color:${BRAND.cardBg}; border:1px solid ${BRAND.border}; border-radius:4px; padding:1px 5px;">${serializeChildren(el)}</span>`;
    case "a": {
      const href = el.getAttribute("href") ?? "#";
      return `<a href="${href.replace(/"/g, "&quot;")}" style="${LINK_STYLE}">${serializeChildren(el)}</a>`;
    }
    case "br":
      return "<br>";
    case "hr":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0;"><tr><td height="1" style="height:1px; line-height:1px; font-size:1px; background-color:${BRAND.border};">&nbsp;</td></tr></table>`;
    case "img": {
      const src = el.getAttribute("src") ?? "";
      const alt = el.getAttribute("alt") ?? "";
      return `<img src="${src.replace(/"/g, "&quot;")}" alt="${alt.replace(/"/g, "&quot;")}" width="560" style="display:block; width:100%; max-width:560px; height:auto; border-radius:8px; margin:6px 0 18px 0;">`;
    }
    case "ul": {
      // TipTap task lists: <ul data-type="taskList">
      if (el.getAttribute("data-type") === "taskList") {
        let rows = "";
        el.querySelectorAll(":scope > li").forEach((li) => {
          const checked = li.getAttribute("data-checked") === "true";
          const contentDiv = li.querySelector("div");
          const inner = contentDiv ? serializeChildrenAsInline(contentDiv) : escapeText(li.textContent ?? "");
          rows += checklistRow(checked, inner);
        });
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BRAND.border}; border-radius:10px; margin:4px 0 18px 0;"><tr><td style="padding:6px 20px 10px 20px;">${rows}</td></tr></table>`;
      }
      let out = "";
      el.querySelectorAll(":scope > li").forEach((li) => {
        out += bulletRow(serializeChildrenAsInline(li), "&#9642;");
      });
      return `<div style="margin:0 0 12px 0;">${out}</div>`;
    }
    case "ol": {
      let out = "";
      let i = Number(el.getAttribute("start") ?? "1");
      el.querySelectorAll(":scope > li").forEach((li) => {
        out += bulletRow(serializeChildrenAsInline(li), `${i}.`);
        i += 1;
      });
      return `<div style="margin:0 0 12px 0;">${out}</div>`;
    }
    case "table": {
      let rows = "";
      el.querySelectorAll("tr").forEach((tr) => {
        let cells = "";
        tr.querySelectorAll("th, td").forEach((cell) => {
          const isHeader = cell.tagName.toLowerCase() === "th";
          const colspan = cell.getAttribute("colspan");
          const rowspan = cell.getAttribute("rowspan");
          const attrs = `${colspan ? ` colspan="${colspan}"` : ""}${rowspan ? ` rowspan="${rowspan}"` : ""}`;
          cells += `<${isHeader ? "th" : "td"}${attrs} style="${isHeader ? TH_STYLE : TD_STYLE}">${serializeChildrenAsInline(cell)}</${isHeader ? "th" : "td"}>`;
        });
        rows += `<tr>${cells}</tr>`;
      });
      return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:4px 0 18px 0;">${rows}</table>`;
    }
    case "blockquote":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.cardBg}; border:1px solid ${BRAND.border}; border-left:4px solid ${BRAND.gold}; border-radius:10px; margin:4px 0 18px 0;"><tr><td style="padding:16px 20px; font-family:${FONT_STACK}; font-size:14px; line-height:22px; color:${BRAND.body};">${serializeChildren(el)}</td></tr></table>`;
    default:
      return serializeChildren(el);
  }
}

/** Serializes children but unwraps lone paragraphs (used inside list items / table cells). */
function serializeChildrenAsInline(el: Element): string {
  const paragraphs = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === "p");
  if (paragraphs.length === 1 && el.children.length === 1) {
    return serializeChildren(paragraphs[0]);
  }
  return serializeChildren(el);
}

/**
 * Entry point: converts editor HTML into inline-styled email HTML.
 * Must run in the browser (uses DOMParser).
 */
export function transformContent(editorHtml: string): string {
  if (typeof window === "undefined") return editorHtml;
  const doc = new DOMParser().parseFromString(`<div id="root">${editorHtml}</div>`, "text/html");
  const root = doc.getElementById("root");
  if (!root) return editorHtml;
  return serializeChildren(root);
}
