import type { EmailTemplate } from "./types";

/**
 * Built-in reusable email templates. Selecting a template pre-fills the
 * editor and document fields; only the content changes per client.
 */

const taskItem = (text: string) =>
  `<li data-type="taskItem" data-checked="false"><p>${text}</p></li>`;

const SCOPE_CONFIRMATION_CONTENT = `
<p>Dear [Client Name],</p>
<p>Thank you for choosing 911 Makers for your website development project.</p>
<p>To ensure the project is delivered accurately and according to your expectations, we would like to confirm the approved project scope and collect the remaining implementation details before development begins.</p>
<h2>Approved Project Scope</h2>
<h3>Pages</h3>
<ul><li>Home</li><li>About Us</li><li>Services</li><li>Book Appointment</li><li>Secure Document Upload</li><li>E-Sign Documents</li><li>Contact Us</li></ul>
<h3>Services</h3>
<ul><li>Tax Preparation</li><li>Cash Advances (Up to $7,000)</li><li>Bookkeeping</li><li>Self Employment</li><li>W-2 Workers</li><li>1099 Filing</li><li>Audit Protection</li><li>Free Consultation</li></ul>
<h3>Features</h3>
<ul><li>Online Appointment Booking (Calendar)</li><li>Secure Document Upload</li><li>Electronic Signature</li><li>Contact Form</li><li>Google Maps Integration</li><li>Click-to-Call Button</li><li>Email Notifications</li><li>Mobile Responsive Design</li><li>SSL Security</li></ul>
<h2>Information Required</h2>
<p>Please provide or confirm the following:</p>
<h3>Website Content</h3>
<ul data-type="taskList">${taskItem("Final content for each approved page.")}${taskItem("Any downloadable forms or PDF documents (if applicable).")}</ul>
<h3>Branding Assets</h3>
<ul data-type="taskList">${taskItem("Company logo.")}${taskItem("Images to be used on the website.")}</ul>
<h3>Appointment Booking</h3>
<ul data-type="taskList">${taskItem("Preferred booking platform (Calendly, Google Calendar, or another provider).")}${taskItem("Existing booking link or account details (if applicable).")}</ul>
<h3>Secure Document Upload</h3>
<ul data-type="taskList">${taskItem("Accepted file types.")}${taskItem("Maximum file size (if applicable).")}${taskItem("Destination for uploaded documents.")}</ul>
<h3>Electronic Signature</h3>
<ul data-type="taskList">${taskItem("The document(s) requiring electronic signature.")}${taskItem("Confirmation whether clients will sign existing PDF forms or another document format.")}</ul>
<h3>Email Notifications</h3>
<ul data-type="taskList">${taskItem("Which events should trigger notifications.")}${taskItem("The email address(es) that should receive them.")}</ul>
<p>Thank you for your cooperation. We look forward to delivering your project.</p>
`;

const COMMON_DEFAULTS = {
  documentSubtitle: "Official Project Documentation · Website Development",
  version: "v1.0",
  senderName: "Tahir Shah Bukhari",
  senderTitle: "Web Solutions & AI Automation Division",
  footerNote:
    "This document serves as part of the formal project record. Please retain it for your records.",
};

export const TEMPLATES: EmailTemplate[] = [
  {
    id: "scope-confirmation",
    name: "Project Scope Confirmation",
    description: "Confirm approved scope and collect required information before development begins.",
    defaults: {
      ...COMMON_DEFAULTS,
      subject: "Project Scope Confirmation & Required Information",
      documentTitle: "Project Scope Confirmation & Required Information",
      status: "Awaiting Client Confirmation",
      contentHtml: SCOPE_CONFIRMATION_CONTENT,
      approvalHeading: "Project Confirmation",
      approvalText:
        "Please review the approved scope and provide the requested information above.\n\nDevelopment will begin after we receive your confirmation and the required materials. Any additional requirements requested after approval may require a separate scope review before implementation.",
      approvalButtonText: "Confirm Project Scope",
      footerNote:
        "This document serves as the formal record of the approved project scope. Please retain it for your records.",
    },
  },
  {
    id: "requirements-collection",
    name: "Requirements Collection",
    description: "Gather detailed functional and content requirements from the client.",
    defaults: {
      ...COMMON_DEFAULTS,
      subject: "Requirements Collection — Action Needed",
      documentTitle: "Requirements Collection",
      status: "Information Requested",
      contentHtml: `<p>Dear [Client Name],</p><p>To move your project forward we need the following requirements from your team.</p><h2>Requirements Needed</h2><ul data-type="taskList">${taskItem("Requirement one.")}${taskItem("Requirement two.")}</ul>`,
      approvalHeading: "Next Step",
      approvalText: "Please reply with the requested requirements so we can proceed to the next phase.",
      approvalButtonText: "Reply With Requirements",
    },
  },
  {
    id: "information-request",
    name: "Information Request",
    description: "Request specific missing information or materials.",
    defaults: {
      ...COMMON_DEFAULTS,
      subject: "Information Request",
      documentTitle: "Information Request",
      status: "Information Requested",
      contentHtml: `<p>Dear [Client Name],</p><p>We require the following information to continue work on your project.</p><ul data-type="taskList">${taskItem("Item one.")}${taskItem("Item two.")}</ul>`,
      approvalHeading: "Requested Information",
      approvalText: "Please provide the items listed above at your earliest convenience.",
      approvalButtonText: "Send Information",
    },
  },
  {
    id: "asset-request",
    name: "Missing Asset Request",
    description: "Request missing files, logos, images, or documents blocking progress.",
    defaults: {
      ...COMMON_DEFAULTS,
      subject: "Missing Assets — Action Needed",
      documentTitle: "Missing Asset Request",
      status: "Information Requested",
      contentHtml: `<p>Dear [Client Name],</p><p>The following assets are currently missing and are required to continue work on your project.</p><h2>Missing Assets</h2><ul data-type="taskList">${taskItem("Asset one.")}${taskItem("Asset two.")}</ul><p>Work on the affected items is paused until these assets are received.</p>`,
      approvalHeading: "Requested Assets",
      approvalText: "Please send the assets listed above so we can continue without delay.",
      approvalButtonText: "Send Assets",
    },
  },
  {
    id: "change-request",
    name: "Change Request",
    description: "Document a requested change and its impact on scope, timeline, or cost.",
    defaults: {
      ...COMMON_DEFAULTS,
      subject: "Change Request — Scope Review",
      documentTitle: "Change Request",
      status: "Awaiting Approval",
      contentHtml: `<p>Dear [Client Name],</p><p>This document records a requested change to the approved project scope.</p><h2>Requested Change</h2><p>Describe the change here.</p><h2>Impact Assessment</h2><ul><li>Scope impact</li><li>Timeline impact</li><li>Cost impact</li></ul>`,
      approvalHeading: "Change Approval",
      approvalText:
        "Please confirm whether you approve this change. Work on the change begins only after written approval.",
      approvalButtonText: "Approve Change",
    },
  },
  {
    id: "design-approval",
    name: "Design Approval",
    description: "Present designs and request formal approval.",
    defaults: {
      ...COMMON_DEFAULTS,
      subject: "Design Approval Request",
      documentTitle: "Design Approval Request",
      status: "Awaiting Approval",
      contentHtml: `<p>Dear [Client Name],</p><p>The design phase of your project is complete. Please review the attached designs.</p><h2>Deliverables for Review</h2><ul><li>Design item one</li><li>Design item two</li></ul>`,
      approvalHeading: "Approval Required",
      approvalText:
        "Please review the designs and confirm your approval. Development begins once approval is received. Change requests after approval may require a scope review.",
      approvalButtonText: "Approve Designs",
    },
  },
  {
    id: "development-update",
    name: "Development Update",
    description: "Progress update during the development phase.",
    defaults: {
      ...COMMON_DEFAULTS,
      subject: "Development Progress Update",
      documentTitle: "Development Progress Update",
      status: "In Progress",
      contentHtml: `<p>Dear [Client Name],</p><p>Here is the latest progress update on your project.</p><h2>Completed This Period</h2><ul><li>Item one</li></ul><h2>Up Next</h2><ul><li>Item one</li></ul>`,
      approvalHeading: "",
      approvalText: "",
      approvalButtonText: "",
    },
  },
  {
    id: "client-review",
    name: "Client Review",
    description: "Invite the client to review completed work.",
    defaults: {
      ...COMMON_DEFAULTS,
      subject: "Ready for Your Review",
      documentTitle: "Client Review Request",
      status: "Ready for Review",
      contentHtml: `<p>Dear [Client Name],</p><p>A milestone of your project is ready for your review.</p><h2>What to Review</h2><ul><li>Item one</li></ul>`,
      approvalHeading: "Feedback Requested",
      approvalText: "Please review the work and share your feedback within 5 business days.",
      approvalButtonText: "Submit Feedback",
    },
  },
  {
    id: "qa-report",
    name: "QA Report",
    description: "Quality assurance results and test coverage summary.",
    defaults: {
      ...COMMON_DEFAULTS,
      subject: "Quality Assurance Report",
      documentTitle: "Quality Assurance Report",
      status: "Testing Complete",
      contentHtml: `<p>Dear [Client Name],</p><p>Quality assurance testing has been completed for your project.</p><h2>Tests Performed</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Functional testing.</p></li><li data-type="taskItem" data-checked="true"><p>Responsive testing.</p></li><li data-type="taskItem" data-checked="true"><p>Cross-browser testing.</p></li></ul>`,
      approvalHeading: "",
      approvalText: "",
      approvalButtonText: "",
    },
  },
  {
    id: "project-handoff",
    name: "Project Handoff",
    description: "Deliver credentials, documentation, and handoff materials.",
    defaults: {
      ...COMMON_DEFAULTS,
      subject: "Project Handoff & Deliverables",
      documentTitle: "Project Handoff",
      status: "Delivered",
      contentHtml: `<p>Dear [Client Name],</p><p>Your project is complete. This document contains the official handoff details.</p><h2>Deliverables</h2><ul><li>Item one</li></ul>`,
      approvalHeading: "Handoff Confirmation",
      approvalText: "Please confirm receipt of all deliverables listed above.",
      approvalButtonText: "Confirm Receipt",
    },
  },
  {
    id: "final-acceptance",
    name: "Final Acceptance",
    description: "Formal project closure and final acceptance sign-off.",
    defaults: {
      ...COMMON_DEFAULTS,
      subject: "Final Acceptance & Project Closure",
      documentTitle: "Final Acceptance",
      status: "Completed",
      contentHtml: `<p>Dear [Client Name],</p><p>All project deliverables have been completed and delivered. This email serves as the formal request for final acceptance.</p>`,
      approvalHeading: "Final Acceptance",
      approvalText:
        "By confirming, you acknowledge that all deliverables have been received and the project is formally closed.",
      approvalButtonText: "Confirm Final Acceptance",
    },
  },
  {
    id: "general",
    name: "General Client Communication",
    description: "Blank branded email for any professional communication.",
    defaults: {
      ...COMMON_DEFAULTS,
      subject: "",
      documentTitle: "Client Communication",
      status: "Draft",
      contentHtml: `<p>Dear [Client Name],</p><p></p>`,
      approvalHeading: "",
      approvalText: "",
      approvalButtonText: "",
    },
  },
];

export function getTemplate(id: string): EmailTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[TEMPLATES.length - 1];
}
