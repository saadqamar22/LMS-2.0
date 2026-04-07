/**
 * Server-side document text extraction.
 * Supports PDF (via pdfjs-dist) and DOCX (via mammoth).
 * Detects actual file type from magic bytes, not from the stored DB type.
 */

export async function extractDocumentText(buffer: Buffer, contentType?: string): Promise<string> {
  // Detect by magic bytes (more reliable than DB type or content-type header)
  const magic4 = buffer.slice(0, 4).toString("hex");

  // PDF: starts with %PDF (25 50 44 46)
  if (magic4 === "25504446") {
    return extractPdfText(buffer);
  }

  // DOCX / XLSX / ZIP: starts with PK (50 4b 03 04)
  if (magic4 === "504b0304") {
    return extractDocxText(buffer);
  }

  // Plain text fallback
  return buffer.toString("utf-8").trim();
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    const path = await import("path");
    const { pathToFileURL } = await import("url");
    const workerPath = path.resolve(
      process.cwd(),
      "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
    );
    pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n").trim();
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return (result.value || "").trim();
}
