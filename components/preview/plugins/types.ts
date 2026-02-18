import { FileData } from "@/types/files";

export interface PreviewPluginProps {
  file: FileData;
  isEditing: boolean;
  onSave?: (data: Blob | string, asNewVersion?: boolean) => Promise<void>;
  fullscreen: boolean;
}

export interface PreviewPlugin {
  id: string;
  name: string;
  canHandle: (mimeType: string) => boolean;
  priority: number;
  component: React.ComponentType<PreviewPluginProps>;
  supportsEdit?: boolean;
}
