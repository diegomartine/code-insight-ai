export interface RepositoryMetadata {
  name: string;
  fullName?: string;
  description?: string | null;
  language?: string | null;
  stars?: number;
  forks?: number;
  defaultBranch?: string;
  url?: string;
}

/**
 * Representación neutral de un repositorio, sin importar si su origen
 * fue una URL de GitHub o un archivo ZIP subido por el usuario.
 * El Analysis Engine solo conoce esta interfaz — nunca GitHub ni ZIP.
 */
export interface RepositorySnapshot {
  source: 'github' | 'zip';
  metadata: RepositoryMetadata;
  filePaths: string[];
  totalFiles: number;
  totalDirectories: number;
  getContent(path: string): Promise<string | null>;
}
