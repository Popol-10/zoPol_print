export type CsvCell = string | number | null | undefined;

function csvCell(value: CsvCell): string {
  let text = String(value ?? "");
  if (typeof value === "string" && /^[=+\-@]/.test(text.trim())) {
    text = "'" + text;
  }
  return '"' + text.replace(/"/g, '""') + '"';
}

export function downloadCsv(filename: string, rows: CsvCell[][]): void {
  const contents =
    "\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
