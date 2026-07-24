import { BRAND, COMPANY, FONT_STACK } from "@/lib/brand";
import type { EmailFields } from "@/lib/types";
import { escapeHtml } from "@/lib/utils";
import { transformContent } from "./transform";

/**
 * Assembles the complete branded 911 Makers email from an EmailFields object.
 * Output is production email HTML: table-based layout, fully inline CSS,
 * max-width 640px, responsive, Resend compatible.
 */

const label = (text: string) =>
  `<div style="font-family:${FONT_STACK}; font-size:11px; line-height:16px; font-weight:700; letter-spacing:1px; color:${BRAND.label}; text-transform:uppercase;">${text}</div>`;

const metaValue = (text: string) =>
  `<div style="font-family:${FONT_STACK}; font-size:15px; line-height:22px; font-weight:600; color:${BRAND.heading}; padding-top:2px;">${escapeHtml(text) || "&mdash;"}</div>`;

function metaCell(title: string, value: string): string {
  return `<tr><td style="padding:0 0 14px 0;">${label(title)}${metaValue(value)}</td></tr>`;
}

function logoImage(size: "large" | "small"): string {
  const width = size === "large" ? 180 : 110;
  return `<img src="${COMPANY.logoUrl}" width="${width}" alt="${COMPANY.name}" style="display:block; width:${width}px; max-width:100%; height:auto; border:0; outline:none; text-decoration:none;">`;
}

export function generateEmail(f: EmailFields): string {
  const content = transformContent(f.contentHtml);
  const year = new Date().getFullYear();

  // Secure client-portal call-to-action (rendered when a portal is attached).
  const portalBlock = f.portalUrl?.trim()
    ? `
    <tr>
    <td style="background-color:${BRAND.white}; padding:6px 0 30px 0; border-left:1px solid ${BRAND.border}; border-right:1px solid ${BRAND.border};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
        <td align="center" class="em-px" style="padding:0 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.cardBg}; border:1px solid ${BRAND.border}; border-radius:10px;">
            <tr>
            <td align="center" style="padding:26px 24px;">
              <div style="font-family:${FONT_STACK}; font-size:15px; line-height:23px; font-weight:700; color:${BRAND.heading};">Complete Your Project Information Online</div>
              <div style="font-family:${FONT_STACK}; font-size:13px; line-height:20px; color:${BRAND.muted}; padding:6px 0 16px 0;">Review the scope, share your details, upload files, and sign — all in one secure portal.</div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                <td align="center" style="background-color:${BRAND.gold}; border-radius:8px;">
                  <a href="${f.portalUrl.trim().replace(/"/g, "&quot;")}" style="display:inline-block; font-family:${FONT_STACK}; font-size:15px; line-height:22px; font-weight:700; color:${BRAND.black}; padding:13px 34px; text-decoration:none;">Review &amp; Complete Project</a>
                </td>
              </tr></table>
              <div style="font-family:${FONT_STACK}; font-size:11px; line-height:17px; color:${BRAND.label}; padding-top:12px;">This secure link is personal to you. Your progress is saved automatically.</div>
            </td>
            </tr>
          </table>
        </td>
        </tr>
      </table>
    </td>
    </tr>`
    : "";

  const approvalBlock = f.approvalText.trim()
    ? `
    <tr>
    <td style="background-color:${BRAND.white}; padding:0 0 34px 0; border-left:1px solid ${BRAND.border}; border-right:1px solid ${BRAND.border};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="em-px" style="padding:0 40px 6px 40px;">${label(escapeHtml(f.approvalHeading || "Confirmation"))}</td></tr>
        <tr>
        <td class="em-px" style="padding:14px 40px 0 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.black}; border-radius:10px;">
            <tr>
            <td style="padding:26px 28px;">
              <div style="font-family:${FONT_STACK}; font-size:14px; line-height:23px; color:${BRAND.border};">${escapeHtml(f.approvalText).replace(/\n/g, "<br>")}</div>
              ${
                f.approvalButtonText.trim()
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;"><tr>
                <td align="center" style="background-color:${BRAND.gold}; border-radius:8px;">
                  <a href="mailto:?subject=${encodeURIComponent(f.subject)}" style="display:inline-block; font-family:${FONT_STACK}; font-size:14px; line-height:20px; font-weight:700; color:${BRAND.black}; padding:12px 28px; text-decoration:none;">${escapeHtml(f.approvalButtonText)}</a>
                </td>
                </tr></table>`
                  : ""
              }
            </td>
            </tr>
          </table>
        </td>
        </tr>
      </table>
    </td>
    </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<title>${escapeHtml(f.documentTitle)} — ${COMPANY.name}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  html, body { margin:0 !important; padding:0 !important; height:100% !important; width:100% !important; }
  * { -ms-text-size-adjust:100%; -webkit-text-size-adjust:100%; }
  table, td { mso-table-lspace:0pt !important; mso-table-rspace:0pt !important; }
  img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
  @media screen and (max-width:640px) {
    .em-container { width:100% !important; }
    .em-px { padding-left:20px !important; padding-right:20px !important; }
    .em-meta-col { display:block !important; width:100% !important; }
    .em-title { font-size:22px !important; line-height:30px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:${BRAND.pageBg}; -webkit-font-smoothing:antialiased;">

<div style="display:none; font-size:1px; color:${BRAND.pageBg}; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">${escapeHtml(f.documentSubtitle)}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.pageBg};">
<tr>
<td align="center" style="padding:32px 12px;">
  <table role="presentation" class="em-container" width="640" cellpadding="0" cellspacing="0" border="0" style="width:640px; max-width:640px;">

    <!-- HEADER -->
    <tr>
    <td style="background-color:${BRAND.black}; border-radius:14px 14px 0 0; padding:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
        <td align="center" class="em-px" style="padding:36px 40px 0 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border:2px solid ${BRAND.white}; border-radius:8px;">
            <tr>
            <td align="center" style="padding:14px 26px 12px 26px;">
              ${logoImage("large")}
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:10px; line-height:14px; font-weight:bold; letter-spacing:5px; color:${BRAND.white}; padding-top:5px;">${COMPANY.tagline.replace(/ /g, "&nbsp;")}</div>
            </td>
            </tr>
          </table>
        </td>
        </tr>
        <tr>
        <td align="center" class="em-px" style="padding:28px 40px 8px 40px;">
          <div class="em-title" style="font-family:${FONT_STACK}; font-size:26px; line-height:34px; font-weight:700; color:${BRAND.white}; letter-spacing:-0.3px;">${escapeHtml(f.documentTitle)}</div>
        </td>
        </tr>
        <tr>
        <td align="center" class="em-px" style="padding:0 40px 36px 40px;">
          <div style="font-family:${FONT_STACK}; font-size:14px; line-height:22px; color:${BRAND.label};">${escapeHtml(f.documentSubtitle)}</div>
        </td>
        </tr>
        <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="3" style="height:3px; line-height:3px; font-size:1px; background-color:${BRAND.gold};">&nbsp;</td></tr></table></td></tr>
      </table>
    </td>
    </tr>

    <!-- DOCUMENT DETAILS -->
    <tr>
    <td style="background-color:${BRAND.white}; padding:0; border-left:1px solid ${BRAND.border}; border-right:1px solid ${BRAND.border};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="em-px" style="padding:30px 40px 6px 40px;">${label("Document Details")}</td></tr>
        <tr>
        <td class="em-px" style="padding:14px 40px 28px 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.cardBg}; border:1px solid ${BRAND.border}; border-radius:10px;">
            <tr>
            <td style="padding:22px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="em-meta-col" width="50%" valign="top" style="width:50%;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${metaCell("Client", f.clientName)}
                      ${metaCell("Company", f.company)}
                      ${metaCell("Date", f.date)}
                      <tr><td style="padding:0;">
                        ${label("Status")}
                        <div style="padding-top:5px;"><span style="display:inline-block; font-family:${FONT_STACK}; font-size:12px; line-height:18px; font-weight:700; color:${BRAND.black}; background-color:${BRAND.gold}; border-radius:20px; padding:3px 14px;">${escapeHtml(f.status)}</span></div>
                      </td></tr>
                    </table>
                  </td>
                  <td class="em-meta-col" width="50%" valign="top" style="width:50%;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${metaCell("Project", f.projectName)}
                      ${metaCell("Reference", f.referenceNumber)}
                      ${metaCell("Version", f.version)}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
            </tr>
          </table>
        </td>
        </tr>
      </table>
    </td>
    </tr>

    <!-- MAIN CONTENT -->
    <tr>
    <td style="background-color:${BRAND.white}; padding:0; border-left:1px solid ${BRAND.border}; border-right:1px solid ${BRAND.border};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="em-px" style="padding:0 40px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="1" style="height:1px; line-height:1px; font-size:1px; background-color:${BRAND.border};">&nbsp;</td></tr></table></td></tr>
        <tr>
        <td class="em-px" style="padding:30px 40px 16px 40px;">
          ${content}
        </td>
        </tr>
      </table>
    </td>
    </tr>

    ${portalBlock}

    ${approvalBlock}

    <!-- SIGNATURE -->
    <tr>
    <td style="background-color:${BRAND.white}; padding:0 0 36px 0; border-left:1px solid ${BRAND.border}; border-right:1px solid ${BRAND.border};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="em-px" style="padding:0 40px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="1" style="height:1px; line-height:1px; font-size:1px; background-color:${BRAND.border};">&nbsp;</td></tr></table></td></tr>
        <tr>
        <td class="em-px" style="padding:26px 40px 0 40px; font-family:${FONT_STACK}; font-size:14px; line-height:22px; color:${BRAND.body};">
          Kind regards,<br><br>
          <span style="font-weight:700; color:${BRAND.heading};">${escapeHtml(f.senderName)}</span><br>
          <span style="color:${BRAND.muted};">${escapeHtml(f.senderTitle)}</span><br>
          <span style="font-weight:700; color:${BRAND.heading};">${COMPANY.name}</span>
        </td>
        </tr>
      </table>
    </td>
    </tr>

    <!-- FOOTER -->
    <tr>
    <td style="background-color:${BRAND.black}; border-radius:0 0 14px 14px; padding:30px 40px;" class="em-px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
        <td align="center">
          ${logoImage("small")}
          <div style="font-family:${FONT_STACK}; font-size:12px; line-height:18px; color:${BRAND.label}; padding-top:4px;">${COMPANY.division.replace(/&/g, "&amp;")}</div>
          <table role="presentation" width="60" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:16px auto;"><tr><td height="2" style="height:2px; line-height:2px; font-size:1px; background-color:${BRAND.gold};">&nbsp;</td></tr></table>
          <div style="font-family:${FONT_STACK}; font-size:11px; line-height:18px; color:${BRAND.muted};">${escapeHtml(f.footerNote)}</div>
          <div style="font-family:${FONT_STACK}; font-size:11px; line-height:18px; color:${BRAND.muted}; padding-top:10px;">
            This email and any attachments form part of the official project documentation for the engagement referenced above.<br>
            &copy; ${year} ${COMPANY.name}. All rights reserved.
          </div>
        </td>
        </tr>
      </table>
    </td>
    </tr>

  </table>
</td>
</tr>
</table>

</body>
</html>`;
}
