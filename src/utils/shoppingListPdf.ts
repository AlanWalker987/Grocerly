import { jsPDF } from "jspdf";
import type { groupedList } from "./shoppingList";

const ink = "#183D2A";
const muted = "#53665A";
const rule = "#D7E1D7";
const left = 18;
const right = 192;
const bottom = 274;
const nameWidth = 91;

// Use the browser's font fallback for custom names outside the PDF's Latin font.
function prepareName(doc: jsPDF, name: string) {
  doc.setFont("helvetica", "normal").setFontSize(11);
  if (/^[\x20-\x7e]+$/.test(name)) {
    const lines: string[] = doc.splitTextToSize(name, nameWidth);
    return {
      height: lines.length * 5,
      draw: (x: number, y: number) =>
        doc
          .setTextColor(ink)
          .text(lines, x, y + 3.7, { lineHeightFactor: 1.28 }),
    };
  }

  const scale = 10;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not render the grocery name.");
  canvas.width = nameWidth * scale;
  const font = "39px system-ui, sans-serif";
  ctx.font = font;
  const lines: string[] = [];
  let line = "";
  for (const character of name) {
    if (line && ctx.measureText(line + character).width > canvas.width - 4) {
      lines.push(line);
      line = "";
    }
    line += character;
  }
  lines.push(line);
  canvas.height = lines.length * 62;
  ctx.font = font;
  ctx.fillStyle = ink;
  lines.forEach((value, index) => ctx.fillText(value, 2, index * 62 + 45));
  return {
    height: canvas.height / scale,
    draw: (x: number, y: number) =>
      doc.addImage(canvas, "PNG", x, y, nameWidth, canvas.height / scale),
  };
}

export function createShoppingListPdf(groups: ReturnType<typeof groupedList>) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.setProperties({
    title: "My Grocery List",
    author: "Grocerly",
    subject: "Grocery shopping checklist",
  });
  const rows = groups.flatMap((group) => group.rows);
  const purchased = rows.filter((row) => row.selection.purchased).length;
  const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(
    new Date(),
  );
  let y = 0;

  function pageHeader(first: boolean) {
    doc
      .setTextColor(ink)
      .setFont("times", "bold")
      .setFontSize(17)
      .text("Grocerly", left, 18);
    doc
      .setFont("helvetica", "normal")
      .setFontSize(9)
      .setTextColor(muted)
      .text(date, right, 17, { align: "right" });
    doc.setDrawColor(rule).setLineWidth(0.3).line(left, 22, right, 22);
    if (first) {
      doc
        .setFont("times", "normal")
        .setTextColor(ink)
        .setFontSize(34)
        .text("My Grocery List", left, 39);
      doc
        .setFillColor("#EFF5EA")
        .roundedRect(left, 45, right - left, 16, 2, 2, "F");
      const stats = [
        [rows.length, "Total items"],
        [purchased, "Purchased"],
        [rows.length - purchased, "Remaining"],
      ] as const;
      stats.forEach(([value, label], index) => {
        const x = left + 5 + index * 58;
        doc
          .setFont("helvetica", "bold")
          .setFontSize(14)
          .setTextColor(ink)
          .text(String(value), x, 52);
        doc
          .setFont("helvetica", "normal")
          .setFontSize(8)
          .setTextColor(muted)
          .text(label, x, 57);
      });
      y = 69;
    } else {
      y = 30;
    }
  }

  function categoryHeader(name: string, continued: boolean) {
    doc
      .setFont("times", "bold")
      .setFontSize(16)
      .setTextColor(ink)
      .text(name, left, y);
    if (continued) {
      const offset = doc.getTextWidth(name) + 2;
      doc
        .setFont("helvetica", "italic")
        .setFontSize(9)
        .setTextColor(muted)
        .text("(continued)", left + offset, y);
    }
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(muted);
    doc.text("QUANTITY", 145, y, { align: "right" });
    doc.text("STATUS", right, y, { align: "right" });
    doc.setDrawColor(rule).line(left, y + 3, right, y + 3);
    y += 5;
  }

  pageHeader(true);
  for (const { category, rows: entries } of groups) {
    entries.forEach(({ item, selection }, index) => {
      const label = prepareName(doc, item.name);
      const rowHeight = Math.max(10, label.height + 5);
      const nextPage = y + rowHeight + (index === 0 ? 5 : 0) > bottom;
      if (nextPage) {
        doc.addPage();
        pageHeader(false);
      }
      if (index === 0 || nextPage) categoryHeader(category.name, index > 0);

      const center = y + rowHeight / 2;
      doc
        .setDrawColor(muted)
        .setLineWidth(0.3)
        .roundedRect(left, center - 1.9, 3.8, 3.8, 0.6, 0.6);
      if (selection.purchased) {
        doc.setDrawColor(ink).setLineWidth(0.45);
        doc.line(left + 0.65, center, left + 1.55, center + 0.9);
        doc.line(left + 1.55, center + 0.9, left + 3.25, center - 1.05);
      }
      doc.setFont("helvetica", "normal").setFontSize(11);
      label.draw(left + 7, center - label.height / 2);
      doc.setTextColor(ink).setFont("helvetica", "bold").setFontSize(10);
      doc.text(selection.quantity + " " + selection.unit, 145, center + 1.4, {
        align: "right",
      });
      doc.setTextColor(muted).setFont("helvetica", "normal").setFontSize(9);
      doc.text(
        selection.purchased ? "Purchased" : "To buy",
        right,
        center + 1.4,
        { align: "right" },
      );
      y += rowHeight;
      doc.setDrawColor(rule).setLineWidth(0.18).line(left, y, right, y);
    });
    y += 9;
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc
      .setPage(page)
      .setDrawColor(rule)
      .setLineWidth(0.25)
      .line(left, 280, right, 280);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(muted);
    doc.text("Grocerly  /  My Grocery List", left, 286);
    doc.text("Page " + page + " of " + pages, right, 286, { align: "right" });
  }
  return doc;
}
