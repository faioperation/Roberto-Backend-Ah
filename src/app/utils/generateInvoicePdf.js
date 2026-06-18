import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { envVars } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root of the project (two levels up from src/app/utils)
const PROJECT_ROOT = path.resolve(__dirname, "../../..");

const INVOICE_DIR = path.join(PROJECT_ROOT, "uploads", "invoices");

/**
 * Generate a professional PDF invoice and save it to disk.
 *
 * @param {object} data
 * @param {string} data.invoiceNo      - Unique invoice number
 * @param {string} data.businessName   - Name of the business
 * @param {string} data.businessEmail  - Email of the business owner
 * @param {string} data.planName       - Subscription plan name
 * @param {string} data.billingCycle   - "MONTHLY" | "YEARLY"
 * @param {number} data.amount         - Invoice amount
 * @param {string} data.currency       - Currency code, e.g. "USD"
 * @param {Date}   data.issuedAt       - Invoice issue date
 * @param {Date}   data.periodStart    - Subscription period start
 * @param {Date}   data.periodEnd      - Subscription period end
 *
 * @returns {{ invoicePath: string, invoiceUrl: string }}
 */
export const generateInvoicePdf = async (data) => {
  // Ensure the output directory exists
  if (!fs.existsSync(INVOICE_DIR)) {
    fs.mkdirSync(INVOICE_DIR, { recursive: true });
  }

  const {
    invoiceNo,
    businessName,
    businessEmail,
    planName,
    billingCycle,
    amount,
    currency = "USD",
    issuedAt = new Date(),
    periodStart,
    periodEnd,
  } = data;

  const fileName = `invoice-${invoiceNo}-${Date.now()}.pdf`;
  const filePath = path.join(INVOICE_DIR, fileName);
  const backendUrl = envVars.BACKEND_URL || "http://localhost:8001";
  const fileUrl = `${backendUrl}/uploads/invoices/${fileName}`;

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // ── HEADER BAND ──────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 110).fill("#6366f1");

    doc
      .fontSize(28)
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .text("ROBARTO", 50, 30, { align: "left" });

    doc
      .fontSize(10)
      .fillColor("rgba(255,255,255,0.8)")
      .font("Helvetica")
      .text("Automate your customer communications with Robarto AI", 50, 62, {
        align: "left",
      });

    doc
      .fontSize(22)
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .text("INVOICE", 0, 35, { align: "right", width: doc.page.width - 50 });

    doc
      .fontSize(10)
      .fillColor("rgba(255,255,255,0.85)")
      .font("Helvetica")
      .text(`# ${invoiceNo}`, 0, 62, {
        align: "right",
        width: doc.page.width - 50,
      });

    // ── INVOICE META ─────────────────────────────────────────────
    const metaY = 130;
    doc
      .fontSize(9)
      .fillColor("#6b7280")
      .font("Helvetica")
      .text("ISSUED TO", 50, metaY)
      .text("ISSUE DATE", 300, metaY)
      .text("STATUS", 430, metaY);

    doc
      .fontSize(11)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text(businessName || "N/A", 50, metaY + 14)
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#374151")
      .text(businessEmail || "", 50, metaY + 30);

    doc
      .fontSize(11)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text(formatDate(issuedAt), 300, metaY + 14);

    // Status badge
    doc.roundedRect(430, metaY + 10, 70, 20, 4).fill("#d1fae5");
    doc
      .fontSize(10)
      .fillColor("#065f46")
      .font("Helvetica-Bold")
      .text("PAID", 430, metaY + 14, { width: 70, align: "center" });

    // ── DIVIDER ──────────────────────────────────────────────────
    doc
      .moveTo(50, metaY + 70)
      .lineTo(doc.page.width - 50, metaY + 70)
      .strokeColor("#e5e7eb")
      .lineWidth(1)
      .stroke();

    // ── TABLE HEADER ─────────────────────────────────────────────
    const tableTop = metaY + 85;
    doc.rect(50, tableTop, doc.page.width - 100, 26).fill("#f3f4f6");

    doc
      .fontSize(9)
      .fillColor("#374151")
      .font("Helvetica-Bold")
      .text("DESCRIPTION", 60, tableTop + 8)
      .text("BILLING CYCLE", 270, tableTop + 8)
      .text("PERIOD", 380, tableTop + 8)
      .text("AMOUNT", 0, tableTop + 8, {
        align: "right",
        width: doc.page.width - 60,
      });

    // ── TABLE ROW ─────────────────────────────────────────────────
    const rowY = tableTop + 36;
    doc
      .fontSize(10)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text(`${planName} Plan`, 60, rowY);

    doc
      .fontSize(10)
      .fillColor("#374151")
      .font("Helvetica")
      .text(billingCycle, 270, rowY)
      .text(
        periodStart && periodEnd
          ? `${formatDate(periodStart)} – ${formatDate(periodEnd)}`
          : "—",
        380,
        rowY,
        { width: 120 }
      );

    doc
      .fontSize(10)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text(`${currency} ${Number(amount).toFixed(2)}`, 0, rowY, {
        align: "right",
        width: doc.page.width - 60,
      });

    // ── ROW DIVIDER ───────────────────────────────────────────────
    doc
      .moveTo(50, rowY + 22)
      .lineTo(doc.page.width - 50, rowY + 22)
      .strokeColor("#f3f4f6")
      .lineWidth(1)
      .stroke();

    // ── TOTAL BOX ─────────────────────────────────────────────────
    const totalY = rowY + 40;
    doc.rect(doc.page.width - 200, totalY, 150, 44).fill("#6366f1");

    doc
      .fontSize(10)
      .fillColor("rgba(255,255,255,0.8)")
      .font("Helvetica")
      .text("TOTAL DUE", doc.page.width - 195, totalY + 7, { width: 140, align: "center" });

    doc
      .fontSize(16)
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .text(
        `${currency} ${Number(amount).toFixed(2)}`,
        doc.page.width - 195,
        totalY + 21,
        { width: 140, align: "center" }
      );

    // ── THANK YOU NOTE ────────────────────────────────────────────
    const noteY = totalY + 70;
    doc
      .fontSize(12)
      .fillColor("#374151")
      .font("Helvetica-Bold")
      .text("Thank you for your business!", 50, noteY, { align: "center" });

    doc
      .fontSize(9)
      .fillColor("#9ca3af")
      .font("Helvetica")
      .text(
        "If you have any questions about this invoice, please contact our support team.",
        50,
        noteY + 18,
        { align: "center" }
      );

    // ── FOOTER ────────────────────────────────────────────────────
    const footerY = doc.page.height - 70;
    doc
      .moveTo(50, footerY)
      .lineTo(doc.page.width - 50, footerY)
      .strokeColor("#e5e7eb")
      .lineWidth(1)
      .stroke();

    doc
      .fontSize(8)
      .fillColor("#9ca3af")
      .font("Helvetica")
      .text(
        `© ${new Date().getFullYear()} Robarto. All rights reserved.   |   Invoice No: ${invoiceNo}`,
        50,
        footerY + 10,
        { align: "center" }
      );

    doc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return {
    invoicePath: `uploads/invoices/${fileName}`,
    invoiceUrl: fileUrl,
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
