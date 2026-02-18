export const features = {
  codeEditor: true,
  pdfAnnotations: true,
  imageEditor: true,
  versioning: true,
  tags: true,
  waveform: true,
  archiveBrowser: true,
};

export const MAX_VERSIONS_PER_FILE = parseInt(
  process.env.MAX_VERSIONS_PER_FILE || "10",
  10
);
