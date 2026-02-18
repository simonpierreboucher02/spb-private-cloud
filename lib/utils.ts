export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("spreadsheet") || mimeType === "text/csv") return "spreadsheet";
  if (mimeType.includes("document") || mimeType.includes("word")) return "document";
  if (mimeType.includes("presentation")) return "presentation";
  if (isArchiveMime(mimeType)) return "archive";
  if (mimeType.startsWith("text/") || mimeType.includes("json") || mimeType.includes("xml") || mimeType.includes("javascript") || mimeType.includes("typescript")) return "code";
  return "file";
}

export function isArchiveMime(mimeType: string): boolean {
  return (
    mimeType === "application/zip" ||
    mimeType === "application/x-zip-compressed" ||
    mimeType === "application/x-rar-compressed" ||
    mimeType === "application/x-7z-compressed" ||
    mimeType === "application/x-tar" ||
    mimeType === "application/gzip" ||
    mimeType.includes("zip") ||
    mimeType.includes("archive") ||
    mimeType.includes("compressed")
  );
}

export function isPreviewable(mimeType: string): boolean {
  return (
    mimeType.startsWith("image/") ||
    mimeType.startsWith("video/") ||
    mimeType.startsWith("audio/") ||
    mimeType === "application/pdf" ||
    mimeType.startsWith("text/") ||
    mimeType === "text/csv" ||
    mimeType.includes("json") ||
    mimeType.includes("xml") ||
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("markdown") ||
    isArchiveMime(mimeType)
  );
}

export function isTextMime(mimeType: string): boolean {
  return (
    mimeType.startsWith("text/") ||
    mimeType.includes("json") ||
    mimeType.includes("xml") ||
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("markdown")
  );
}

export function isCodeMime(mimeType: string): boolean {
  return (
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("json") ||
    mimeType.includes("xml") ||
    mimeType.includes("css") ||
    mimeType.includes("html") ||
    mimeType.includes("python") ||
    mimeType.includes("java") ||
    mimeType.includes("x-c") ||
    mimeType.includes("rust") ||
    mimeType.includes("go") ||
    mimeType.includes("yaml") ||
    mimeType.includes("toml") ||
    mimeType.includes("sql") ||
    mimeType.includes("shell") ||
    mimeType.includes("bash")
  );
}

export function getLanguageFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "application/javascript": "javascript",
    "text/javascript": "javascript",
    "application/typescript": "typescript",
    "text/typescript": "typescript",
    "application/json": "json",
    "text/html": "html",
    "text/css": "css",
    "text/xml": "xml",
    "application/xml": "xml",
    "text/markdown": "markdown",
    "text/x-python": "python",
    "text/x-java": "java",
    "text/x-c": "c",
    "text/x-cpp": "cpp",
    "text/x-rust": "rust",
    "text/x-go": "go",
    "text/yaml": "yaml",
    "application/x-yaml": "yaml",
    "text/x-toml": "toml",
    "text/x-sql": "sql",
    "text/x-shellscript": "shell",
    "application/x-sh": "shell",
  };
  return map[mimeType] || "text";
}

export function getLanguageFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    html: "html",
    htm: "html",
    css: "css",
    scss: "css",
    xml: "xml",
    md: "markdown",
    py: "python",
    java: "java",
    c: "c",
    h: "c",
    cpp: "cpp",
    hpp: "cpp",
    rs: "rust",
    go: "go",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    sql: "sql",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    rb: "ruby",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    r: "r",
    lua: "lua",
    dockerfile: "dockerfile",
  };
  return map[ext] || "text";
}
