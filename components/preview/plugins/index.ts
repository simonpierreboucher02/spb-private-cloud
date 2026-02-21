/* eslint-disable @typescript-eslint/no-explicit-any */
import dynamic from "next/dynamic";
import type { PreviewPlugin } from "./types";
import { isArchiveMime, isCodeMime, isTextMime } from "@/lib/utils";

const ImagePreview = dynamic(() => import("./ImagePreview"), { ssr: false });
const VideoPreview = dynamic(() => import("./VideoPreview"), { ssr: false });
const AudioPreview = dynamic(() => import("./AudioPreview"), { ssr: false });
const PdfPreview = dynamic(() => import("./PdfPreview"), { ssr: false });
const CodePreview = dynamic(() => import("./CodePreview"), { ssr: false });
const CsvJsonPreview = dynamic(() => import("./CsvJsonPreview"), { ssr: false });
const MarkdownPreview = dynamic(() => import("./MarkdownPreview"), { ssr: false });
const ArchivePreview = dynamic(() => import("./ArchivePreview"), { ssr: false });
const WordPreview = dynamic(() => import("./WordPreview"), { ssr: false });
const ExcelPreview = dynamic(() => import("./ExcelPreview"), { ssr: false });
const FallbackPreview = dynamic(() => import("./FallbackPreview"), { ssr: false });

const WORD_MIMES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
  "application/vnd.oasis.opendocument.text", // .odt
];

const EXCEL_MIMES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "application/vnd.ms-excel.sheet.macroEnabled.12", // .xlsm
  "application/vnd.ms-excel.sheet.binary.macroEnabled.12", // .xlsb
  "application/vnd.oasis.opendocument.spreadsheet", // .ods
];

const plugins: PreviewPlugin[] = [
  {
    id: "image",
    name: "Image",
    canHandle: (mime) => mime.startsWith("image/"),
    priority: 10,
    component: ImagePreview as any,
  },
  {
    id: "video",
    name: "Video",
    canHandle: (mime) => mime.startsWith("video/"),
    priority: 10,
    component: VideoPreview as any,
  },
  {
    id: "audio",
    name: "Audio",
    canHandle: (mime) => mime.startsWith("audio/"),
    priority: 10,
    component: AudioPreview as any,
  },
  {
    id: "pdf",
    name: "PDF",
    canHandle: (mime) => mime === "application/pdf",
    priority: 10,
    component: PdfPreview as any,
    supportsEdit: true,
  },
  {
    id: "csv-json",
    name: "CSV/JSON",
    canHandle: (mime) => mime === "text/csv" || mime.includes("json"),
    priority: 15,
    component: CsvJsonPreview as any,
  },
  {
    id: "markdown",
    name: "Markdown",
    canHandle: (mime) => mime.includes("markdown") || mime === "text/x-markdown",
    priority: 15,
    component: MarkdownPreview as any,
  },
  {
    id: "code",
    name: "Code",
    canHandle: (mime) => isCodeMime(mime),
    priority: 10,
    component: CodePreview as any,
    supportsEdit: true,
  },
  {
    id: "text",
    name: "Texte",
    canHandle: (mime) => isTextMime(mime),
    priority: 5,
    component: CodePreview as any,
    supportsEdit: true,
  },
  {
    id: "word",
    name: "Word",
    canHandle: (mime) => WORD_MIMES.includes(mime),
    priority: 15,
    component: WordPreview as any,
    supportsEdit: true,
  },
  {
    id: "excel",
    name: "Excel",
    canHandle: (mime) => EXCEL_MIMES.includes(mime),
    priority: 15,
    component: ExcelPreview as any,
    supportsEdit: true,
  },
  {
    id: "archive",
    name: "Archive",
    canHandle: (mime) => isArchiveMime(mime),
    priority: 10,
    component: ArchivePreview as any,
  },
  {
    id: "fallback",
    name: "Télécharger",
    canHandle: () => true,
    priority: 0,
    component: FallbackPreview as any,
  },
];

export function getPlugin(mimeType: string): PreviewPlugin {
  return plugins
    .filter((p) => p.canHandle(mimeType))
    .sort((a, b) => b.priority - a.priority)[0];
}

export function getAllPlugins(): PreviewPlugin[] {
  return plugins;
}
