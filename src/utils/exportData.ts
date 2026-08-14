import { jsPDF } from "jspdf";

const FORMULA_PREFIX = /^[=+\-@]/;

const sanitizeSpreadsheetValue = (value: unknown): string | number | boolean => {
  if (typeof value === "number" || typeof value === "boolean") return value;
  const text = String(value ?? "");
  return FORMULA_PREFIX.test(text) ? `'${text}` : text;
};

const escapeXml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const sanitizeDownloadName = (filename: string): string =>
  filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "export";

export const exportJSON = (data: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeDownloadName(filename)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportCSV = <T extends Record<string, unknown>>(
  data: T[],
  filename: string,
) => {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const escaped = String(sanitizeSpreadsheetValue(row[header])).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeDownloadName(filename)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportPDF = (data: unknown, filename: string, title?: string) => {
  const doc = new jsPDF();

  if (title) {
    doc.setFontSize(16);
    doc.text(title, 20, 20);
    doc.setFontSize(12);
  }

  let yPosition = title ? 40 : 20;
  const pageHeight = doc.internal.pageSize.height;

  const addText = (text: string, x: number = 20) => {
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(text, x, yPosition);
    yPosition += 7;
  };

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      addText(`${index + 1}. ${JSON.stringify(item, null, 2)}`);
    });
  } else {
    addText(JSON.stringify(data, null, 2));
  }

  doc.save(`${sanitizeDownloadName(filename)}.pdf`);
};

const spreadsheetCell = (value: unknown): string => {
  const safeValue = sanitizeSpreadsheetValue(value);
  const type = typeof safeValue === "number"
    ? "Number"
    : typeof safeValue === "boolean"
      ? "Boolean"
      : "String";
  return `<Cell><Data ss:Type="${type}">${escapeXml(safeValue)}</Data></Cell>`;
};

/**
 * Generates Excel 2003 XML (SpreadsheetML), which Excel and LibreOffice open
 * directly. It avoids a client-side workbook parser and neutralizes formulas.
 */
export const exportExcel = <T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName: string = "Sheet1",
) => {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const safeSheetName = sheetName
    .replace(/[\\/:?*]/g, "_")
    .replace(/\[/g, "_")
    .replace(/\]/g, "_")
    .slice(0, 31) || "Sheet1";
  const headerRow = `<Row>${headers.map(spreadsheetCell).join("")}</Row>`;
  const dataRows = data
    .map((row) => `<Row>${headers.map((header) => spreadsheetCell(row[header])).join("")}</Row>`)
    .join("");
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${escapeXml(safeSheetName)}">
    <Table>
      ${headerRow}
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;

  downloadBlob(
    new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" }),
    `${sanitizeDownloadName(filename)}.xls`,
  );
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = sanitizeDownloadName(filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
