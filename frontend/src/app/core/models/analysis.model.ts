/**
 * Modelos TypeScript del contrato de respuesta del backend Code Insight AI.
 *
 * IMPORTANTE: estos tipos fueron verificados directamente contra el código
 * fuente del backend (analysis.service.ts y los *-analyzer.service.ts), no
 * inventados a partir del enunciado. En particular:
 *
 * - `findings`, `risks` y `recommendations` son arreglos de STRINGS simples
 *   (no objetos con severidad/id/etc). El backend no produce esa
 *   estructura, así que el frontend no debe inventarla.
 * - `components` en la respuesta NO incluye el campo `evidence` (existe
 *   internamente en el backend pero no se serializa en la respuesta HTTP).
 */

export type RepositorySource = 'github' | 'zip';

export interface RepositoryInfo {
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number | null;
  forks: number | null;
  defaultBranch: string | null;
  url: string | null;
  source: RepositorySource;
}

export interface StructureInfo {
  totalFiles: number;
  totalDirectories: number;
  importantFiles: string[];
  files: string[];
}

export interface TechnologyInfo {
  language: string | null;
  frameworks: string[];
  technologies: string[];
  packageManager: string | null;
  buildTool: string | null;
  typescript: boolean;
  evidence: string[];
}

export interface ComponentsInfo {
  controllers: string[];
  services: string[];
  repositories: string[];
  models: string[];
  frontendComponents: string[];
  modules: string[];
  routes: string[];
}

export interface ArchitectureInfo {
  pattern: string;
  confidence: number;
  evidence: string[];
}

export interface DetectedEndpoint {
  method: string;
  path: string;
  file: string;
}

export interface ApiInfo {
  backend: { detectedFiles: string[]; total: number };
  frontend: { detectedFiles: string[]; total: number };
  endpoints: DetectedEndpoint[];
  total: number;
}

export interface CodeSample {
  path: string;
  content: string;
}

/** El backend devuelve hallazgos/riesgos/recomendaciones como texto plano. */
export type Finding = string;
export type Risk = string;
export type Recommendation = string;

export interface AnalysisResponse {
  status: 'analysis_completed';
  repository: RepositoryInfo;
  structure: StructureInfo;
  technology: TechnologyInfo;
  components: ComponentsInfo;
  architecture: ArchitectureInfo;
  apis: ApiInfo;
  functionalSummary: string;
  findings: Finding[];
  recommendations: Recommendation[];
  risks: Risk[];
  codeSamples: CodeSample[];
}

/** Forma del error que produce el ExceptionFilter por defecto de NestJS. */
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}
