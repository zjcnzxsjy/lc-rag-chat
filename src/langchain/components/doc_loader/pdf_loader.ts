import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

export async function webLoadPDF(blob: Blob) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.min.mjs")
  const pdfjsWorker = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker
  const loader = new WebPDFLoader(blob, {
    parsedItemSeparator: "",
    pdfjs: () => pdfjs
  });
  const docs = await loader.load();
  return docs;
}
