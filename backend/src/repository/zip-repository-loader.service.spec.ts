import * as zlib from 'zlib';
import { ZipRepositoryLoaderService } from './zip-repository-loader.service';

/**
 * Construye un ZIP mínimo válido (método STORED, sin compresión) en
 * memoria, solo para pruebas — evita depender de una librería externa.
 */
function buildZip(entries: { path: string; content: string }[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const { path, content } of entries) {
    const nameBuf = Buffer.from(path, 'utf-8');
    const dataBuf = Buffer.from(content, 'utf-8');
    const crc = zlib.crc32 ? zlib.crc32(dataBuf) : 0;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(0, 8); // compression: stored
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0, 12); // mod date
    localHeader.writeUInt32LE(crc >>> 0, 14);
    localHeader.writeUInt32LE(dataBuf.length, 18);
    localHeader.writeUInt32LE(dataBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const localEntry = Buffer.concat([localHeader, nameBuf, dataBuf]);
    localParts.push(localEntry);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc >>> 0, 16);
    centralHeader.writeUInt32LE(dataBuf.length, 20);
    centralHeader.writeUInt32LE(dataBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(Buffer.concat([centralHeader, nameBuf]));
    offset += localEntry.length;
  }

  const localBuffer = Buffer.concat(localParts);
  const centralBuffer = Buffer.concat(centralParts);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuffer.length, 12);
  eocd.writeUInt32LE(localBuffer.length, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([localBuffer, centralBuffer, eocd]);
}

describe('ZipRepositoryLoaderService', () => {
  const service = new ZipRepositoryLoaderService();

  it('carga un ZIP válido y expone su contenido vía getContent', async () => {
    const zip = buildZip([
      { path: 'demo/package.json', content: '{"name":"demo"}' },
      { path: 'demo/src/app.controller.ts', content: 'export class AppController {}' },
    ]);

    const snapshot = service.load(zip, 'demo.zip');

    expect(snapshot.filePaths).toEqual(
      expect.arrayContaining(['package.json', 'src/app.controller.ts']),
    );

    const content = await snapshot.getContent('package.json');
    expect(content).toBe('{"name":"demo"}');
  });

  it('rechaza entradas con path traversal (zip-slip) sin lanzar excepción, simplemente ignorándolas', () => {
    const zip = buildZip([
      { path: 'demo/src/app.ts', content: 'ok' },
      { path: '../../etc/passwd', content: 'malicioso' },
      { path: 'demo/../../../evil.txt', content: 'malicioso' },
    ]);

    const snapshot = service.load(zip, 'demo.zip');

    expect(snapshot.filePaths).toContain('src/app.ts');
    expect(snapshot.filePaths.some((p) => p.includes('..'))).toBe(false);
    expect(snapshot.filePaths.some((p) => p.includes('etc/passwd'))).toBe(false);
    expect(snapshot.filePaths.some((p) => p.includes('evil.txt'))).toBe(false);
  });

  it('rechaza un archivo que no es un ZIP válido', () => {
    const notAZip = Buffer.from('esto no es un zip');
    expect(() => service.load(notAZip, 'archivo.zip')).toThrow();
  });
});
