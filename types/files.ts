export interface FileData {
  id: string;
  name: string;
  storagePath?: string;
  size: number;
  mimeType: string;
  folderId?: string | null;
  createdAt: string;
  updatedAt?: string;
  metadata?: FileMetadataData | null;
  tags?: FileTagData[];
  _count?: { versions: number };
}

export interface FolderData {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  _count?: { files: number; children: number };
}

export interface FileMetadataData {
  id: string;
  description?: string | null;
  isFavorite: boolean;
  customDates?: Record<string, string> | null;
}

export interface TagData {
  id: string;
  name: string;
  color: string;
}

export interface FileTagData {
  id: string;
  tag: TagData;
}

export interface FileVersionData {
  id: string;
  fileId: string;
  versionNum: number;
  storagePath: string;
  size: number;
  changeNote?: string | null;
  createdAt: string;
}

export type ViewerMode = "preview" | "edit";

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
