import * as zlib from 'zlib';

/**
 * Lector mínimo de archivos ZIP (formato estándar, sin ZIP64 y sin cifrado)
 * implementado únicamente con Buffer + zlib nativos de Node, para no
 * depender de paquetes externos (adm-zip, unzipper, etc.).
 *
 * Referencia del formato: PKWARE APPNOTE.TXT
 * - End Of Central Directory (EOCD): 0x06054b50
 * - Central Directory File Header:    0x02014b50
 * - Local File Header:                0x04034b50
 */

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIR_SIGNATURE = 0x02014b50;
const LOCAL_FILE_SIGNATURE = 0x04034b50;

export interface ZipEntry {
  path: string;
  isDirectory: boolean;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
  compressionMethod: number;
}

export function parseZipEntries(buffer: Buffer): ZipEntry[] {
  const eocdOffset = findEndOfCentralDirectory(buffer);

  if (eocdOffset === -1) {
    throw new Error(
      'No se encontró el registro End Of Central Directory (EOCD); el archivo no parece ser un ZIP válido',
    );
  }

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirOffset = buffer.readUInt32LE(eocdOffset + 16);

  const entries: ZipEntry[] = [];
  let offset = centralDirOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (offset + 46 > buffer.length) {
      break;
    }

    const signature = buffer.readUInt32LE(offset);
    if (signature !== CENTRAL_DIR_SIGNATURE) {
      break;
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraFieldLength = buffer.readUInt16LE(offset + 30);
    const fileCommentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);

    const fileNameStart = offset + 46;
    const path = buffer.toString(
      'utf-8',
      fileNameStart,
      fileNameStart + fileNameLength,
    );

    entries.push({
      path,
      isDirectory: path.endsWith('/'),
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
      compressionMethod,
    });

    offset = fileNameStart + fileNameLength + extraFieldLength + fileCommentLength;
  }

  return entries;
}

export function readZipEntryContent(buffer: Buffer, entry: ZipEntry): Buffer {
  const offset = entry.localHeaderOffset;

  if (offset + 30 > buffer.length) {
    throw new Error(`Encabezado local fuera de rango para ${entry.path}`);
  }

  const signature = buffer.readUInt32LE(offset);
  if (signature !== LOCAL_FILE_SIGNATURE) {
    throw new Error(`Encabezado local inválido para ${entry.path}`);
  }

  const fileNameLength = buffer.readUInt16LE(offset + 26);
  const extraFieldLength = buffer.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraFieldLength;
  const compressedData = buffer.subarray(
    dataStart,
    dataStart + entry.compressedSize,
  );

  if (entry.compressionMethod === 0) {
    return Buffer.from(compressedData);
  }

  if (entry.compressionMethod === 8) {
    return zlib.inflateRawSync(compressedData);
  }

  throw new Error(
    `Método de compresión no soportado (${entry.compressionMethod}) para ${entry.path}`,
  );
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  const minLength = 22;
  const maxCommentLength = 65535;
  const searchStart = Math.max(0, buffer.length - minLength - maxCommentLength);

  for (let i = buffer.length - minLength; i >= searchStart; i--) {
    if (buffer.readUInt32LE(i) === EOCD_SIGNATURE) {
      return i;
    }
  }

  return -1;
}
