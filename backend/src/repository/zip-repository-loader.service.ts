import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { parseZipEntries, readZipEntryContent, ZipEntry } from './zip-utils';
import { RepositorySnapshot } from './types';

const MAX_UNCOMPRESSED_TOTAL_BYTES = 80 * 1024 * 1024; // 80MB descomprimidos en total
const MAX_ENTRY_COUNT = 8000;
const MAX_SINGLE_FILE_BYTES = 5 * 1024 * 1024; // 5MB al leer un archivo individual

const IGNORED_SEGMENTS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '.next',
  '.nuxt',
  '__pycache__',
  'venv',
  '.venv',
  'target',
  'bin',
  'obj',
  '.idea',
  '.vscode',
  '.gradle',
]);

@Injectable()
export class ZipRepositoryLoaderService {
  load(buffer: Buffer, originalFileName?: string): RepositorySnapshot {
    if (!buffer || buffer.length < 4) {
      throw new BadRequestException(
        'El archivo enviado está vacío o no es un ZIP válido',
      );
    }

    // Firma local de un ZIP: los primeros dos bytes son "PK" (0x50, 0x4B)
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      throw new BadRequestException(
        'El archivo enviado no corresponde a un ZIP válido',
      );
    }

    let rawEntries: ZipEntry[];
    try {
      rawEntries = parseZipEntries(buffer);
    } catch (error) {
      throw new BadRequestException(
        `No fue posible leer el archivo ZIP: ${(error as Error).message}`,
      );
    }

    if (rawEntries.length === 0) {
      throw new BadRequestException('El archivo ZIP está vacío');
    }

    if (rawEntries.length > MAX_ENTRY_COUNT) {
      throw new PayloadTooLargeException(
        `El ZIP contiene demasiados archivos (${rawEntries.length}). Límite permitido: ${MAX_ENTRY_COUNT}`,
      );
    }

    const totalUncompressed = rawEntries.reduce(
      (sum, entry) => sum + entry.uncompressedSize,
      0,
    );

    if (totalUncompressed > MAX_UNCOMPRESSED_TOTAL_BYTES) {
      throw new PayloadTooLargeException(
        `El contenido descomprimido del ZIP excede el límite permitido (${Math.round(
          MAX_UNCOMPRESSED_TOTAL_BYTES / 1024 / 1024,
        )}MB)`,
      );
    }

    // GitHub y muchos editores generan ZIPs con una única carpeta raíz
    // envolvente (p. ej. "mi-proyecto-main/"). La removemos para que las
    // rutas queden equivalentes a las que produce el loader de GitHub.
    const commonRootPrefix = detectCommonRootPrefix(rawEntries);

    const safeEntries: { entry: ZipEntry; normalizedPath: string }[] = [];

    for (const entry of rawEntries) {
      if (entry.isDirectory) {
        continue;
      }

      const normalizedPath = normalizeZipPath(entry.path, commonRootPrefix);

      // normalizedPath === null: ruta absoluta o intento de path traversal
      // ("../"), es decir un posible ataque de zip-slip. Se descarta el
      // archivo por completo en lugar de intentar "arreglar" la ruta.
      if (normalizedPath === null) {
        continue;
      }

      if (isIgnoredPath(normalizedPath)) {
        continue;
      }

      safeEntries.push({ entry, normalizedPath });
    }

    if (safeEntries.length === 0) {
      throw new BadRequestException(
        'El ZIP no contiene archivos analizables (todo su contenido fue ignorado o es inseguro)',
      );
    }

    const filePaths = safeEntries.map((e) => e.normalizedPath);
    const totalDirectories = countDirectories(filePaths);

    const pathIndex = new Map(
      safeEntries.map((e) => [e.normalizedPath, e.entry]),
    );
    const contentCache = new Map<string, string | null>();

    const projectName =
      commonRootPrefix?.replace(/\/$/, '') ||
      (originalFileName
        ? originalFileName.replace(/\.zip$/i, '')
        : 'repositorio-zip');

    return {
      source: 'zip',
      metadata: {
        name: projectName,
        description: null,
        language: null,
      },
      filePaths,
      totalFiles: filePaths.length,
      totalDirectories,
      getContent: async (path: string) => {
        if (contentCache.has(path)) {
          return contentCache.get(path) ?? null;
        }

        const entry = pathIndex.get(path);
        if (!entry || entry.uncompressedSize > MAX_SINGLE_FILE_BYTES) {
          contentCache.set(path, null);
          return null;
        }

        try {
          const content = readZipEntryContent(buffer, entry).toString('utf-8');
          contentCache.set(path, content);
          return content;
        } catch {
          contentCache.set(path, null);
          return null;
        }
      },
    };
  }
}

function detectCommonRootPrefix(entries: ZipEntry[]): string | null {
  const validEntries = entries.filter((entry) => {
    if (entry.isDirectory) {
      return true;
    }

    const path = entry.path.replace(/\\/g, '/');

    // Ignorar rutas absolutas
    if (path.startsWith('/') || /^[a-zA-Z]:/.test(path)) {
      return false;
    }

    // Ignorar intentos de path traversal
    const segments = path.split('/');

    return !segments.some((segment) => segment === '..');
  });

  const firstSegments = validEntries
    .map((entry) => entry.path.replace(/\\/g, '/').split('/')[0])
    .filter((segment) => segment.length > 0 && segment !== '.');

  const uniqueFirstSegments = new Set(firstSegments);

  if (uniqueFirstSegments.size !== 1) {
    return null;
  }

  const [root] = uniqueFirstSegments;

  const allNested = validEntries.every((entry) => {
    const path = entry.path.replace(/\\/g, '/');

    return path === root || path.startsWith(`${root}/`);
  });

  return allNested ? `${root}/` : null;
}

function normalizeZipPath(
  rawPath: string,
  commonRootPrefix: string | null,
): string | null {
  let path = rawPath.replace(/\\/g, '/');

  if (commonRootPrefix && path.startsWith(commonRootPrefix)) {
    path = path.slice(commonRootPrefix.length);
  }

  if (path.startsWith('/') || /^[a-zA-Z]:/.test(path)) {
    return null;
  }

  const segments = path.split('/');
  const resolved: string[] = [];

  for (const segment of segments) {
    if (segment === '' || segment === '.') {
      continue;
    }

    if (segment === '..') {
      // Intento de escapar del directorio raíz (zip-slip): se rechaza.
      return null;
    }

    resolved.push(segment);
  }

  return resolved.length > 0 ? resolved.join('/') : null;
}

function isIgnoredPath(path: string): boolean {
  const segments = path.toLowerCase().split('/');
  return segments.some((segment) => IGNORED_SEGMENTS.has(segment));
}

function countDirectories(filePaths: string[]): number {
  const directories = new Set<string>();

  for (const path of filePaths) {
    const segments = path.split('/');
    segments.pop();

    let accumulated = '';
    for (const segment of segments) {
      accumulated = accumulated ? `${accumulated}/${segment}` : segment;
      directories.add(accumulated);
    }
  }

  return directories.size;
}
