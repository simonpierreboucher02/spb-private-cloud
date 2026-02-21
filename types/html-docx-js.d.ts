declare module "html-docx-js/dist/html-docx" {
  interface HtmlDocxOptions {
    orientation?: "landscape" | "portrait";
    margins?: {
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
      header?: number;
      footer?: number;
      gutter?: number;
    };
  }
  export function asBlob(html: string, options?: HtmlDocxOptions): Blob;
}
