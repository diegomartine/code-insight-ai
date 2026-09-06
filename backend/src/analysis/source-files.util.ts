const IGNORED_SEGMENTS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '__pycache__',
  'venv',
  '.venv',
  'target',
  'bin',
  'obj',
];

const TEST_SUFFIXES = [
  '.spec.ts',
  '.spec.tsx',
  '.spec.js',
  '.spec.jsx',
  '.test.ts',
  '.test.tsx',
  '.test.js',
  '.test.jsx',
  '.test.py',
  '_test.go',
];

/**
 * Filtra rutas de código fuente relevante: excluye dependencias instaladas,
 * artefactos de build y archivos de test (estos últimos se usan solo para
 * el hallazgo "ausencia/presencia de tests", no para inferir componentes).
 */
export function filterSourceFiles(filePaths: string[]): string[] {
  return filePaths.filter((path) => {
    const normalized = path.toLowerCase();

    if (
      IGNORED_SEGMENTS.some(
        (segment) =>
          normalized.includes(`/${segment}/`) ||
          normalized.startsWith(`${segment}/`),
      )
    ) {
      return false;
    }

    if (TEST_SUFFIXES.some((suffix) => normalized.endsWith(suffix))) {
      return false;
    }

    return true;
  });
}

export function hasTestFiles(filePaths: string[]): boolean {
  return filePaths.some((path) => {
    const normalized = path.toLowerCase();
    return (
      TEST_SUFFIXES.some((suffix) => normalized.endsWith(suffix)) ||
      normalized.includes('/__tests__/') ||
      normalized.includes('/tests/') ||
      /(^|\/)test\//.test(normalized)
    );
  });
}
