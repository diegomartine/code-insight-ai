import { Injectable } from '@nestjs/common';
import { GithubRepositoryLoaderService } from '../repository/github-repository-loader.service';
import { ZipRepositoryLoaderService } from '../repository/zip-repository-loader.service';
import { RepositorySnapshot } from '../repository/types';
import { ComponentAnalyzerService } from './component-analyzer.service';
import { ArchitectureAnalyzerService } from './architecture-analyzer.service';
import { ApiAnalyzerService } from './api-analyzer.service';
import {
  TechnologyDetectorService,
  ManifestContents,
  PackageJson,
} from './technology-detector.service';
import { FunctionalAnalysisService } from './functional-analysis.service';
import { FindingsService } from './findings.service';
import { RisksService } from './risks.service';
import { RecommendationsService } from './recommendations.service';

const IMPORTANT_FILE_NAMES = [
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'tsconfig.json',
  'nest-cli.json',
  'angular.json',
  'vite.config.ts',
  'vite.config.js',
  'next.config.js',
  'next.config.ts',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  'README.md',
  'schema.prisma',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'requirements.txt',
  'pyproject.toml',
  'go.mod',
  'Cargo.toml',
  'composer.json',
  'Gemfile',
];

const MAX_CODE_SAMPLES = 80;
const MAX_SAMPLE_LENGTH = 5000;

const RELEVANT_NAME_PATTERNS: RegExp[] = [
  /controller/i,
  /service/i,
  /repository/i,
  /entity/i,
  /model/i,
  /module/i,

  /\.component\.(ts|tsx)$/i,
  /\.api\.(ts|tsx)$/i,

  /routes?\.(ts|js|py)$/i,

  /views\.py$/i,
  /urls\.py$/i,

  // Backend entrypoints.
  // Se incluyen como evidencia, pero NO se consideran
  // automáticamente endpoints.
  /^(app|server|main)\.(js|ts|jsx|tsx)$/i,
];

const RELEVANT_EXTENSIONS = /\.(ts|tsx|js|jsx|java|cs|py|go)$/i;

@Injectable()
export class AnalysisService {
  constructor(
    private readonly githubLoader: GithubRepositoryLoaderService,
    private readonly zipLoader: ZipRepositoryLoaderService,
    private readonly componentAnalyzer: ComponentAnalyzerService,
    private readonly architectureAnalyzer: ArchitectureAnalyzerService,
    private readonly apiAnalyzer: ApiAnalyzerService,
    private readonly technologyDetector: TechnologyDetectorService,
    private readonly functionalAnalysis: FunctionalAnalysisService,
    private readonly findingsService: FindingsService,
    private readonly risksService: RisksService,
    private readonly recommendationsService: RecommendationsService,
  ) {}

  async analyzeFromGithub(repositoryUrl: string) {
    const snapshot = await this.githubLoader.load(repositoryUrl);
    return this.analyzeSnapshot(snapshot);
  }

  async analyzeFromZip(buffer: Buffer, originalFileName?: string) {
    const snapshot = this.zipLoader.load(buffer, originalFileName);
    return this.analyzeSnapshot(snapshot);
  }

  private async analyzeSnapshot(snapshot: RepositorySnapshot) {
    const { filePaths } = snapshot;

    const importantFiles = filePaths.filter((path) => {
      const fileName = path.split('/').pop();
      return (
        fileName !== undefined &&
        IMPORTANT_FILE_NAMES.map((n) => n.toLowerCase()).includes(
          fileName.toLowerCase(),
        )
      );
    });

    const manifests = await this.resolveManifests(snapshot, filePaths);

    const technology = this.technologyDetector.detect(
      filePaths,
      manifests,
      snapshot.metadata.language ?? null,
    );

    const relevantFiles = filePaths
      .filter((path) => this.isRelevantCodeFile(path))
      .slice(0, MAX_CODE_SAMPLES);

    const codeSamples = await this.readFiles(
      snapshot,
      relevantFiles,
      MAX_SAMPLE_LENGTH,
    );

    const components = this.componentAnalyzer.analyze(filePaths);
    const apis = this.apiAnalyzer.analyze(codeSamples);

    const architecture = this.architectureAnalyzer.analyze(
      filePaths,
      components,
      apis,
    );
    const functional = this.functionalAnalysis.analyze(
      filePaths,
      components,
      technology,
      apis,
    );

    const findings = this.findingsService.build({
      filePaths,
      importantFiles,
      components,
      technology,
      architecture,
      apis,
      functional,
    });

    const risks = this.risksService.build({
      filePaths,
      components,
      architecture,
      apis,
      codeSamples,
    });

    const recommendations = this.recommendationsService.build({
      filePaths,
      components,
      apis,
      architecture,
    });

    return {
      status: 'analysis_completed',

      repository: {
        name: snapshot.metadata.name,
        fullName: snapshot.metadata.fullName ?? snapshot.metadata.name,
        description: snapshot.metadata.description ?? null,
        language: snapshot.metadata.language ?? technology.language,
        stars: snapshot.metadata.stars ?? null,
        forks: snapshot.metadata.forks ?? null,
        defaultBranch: snapshot.metadata.defaultBranch ?? null,
        url: snapshot.metadata.url ?? null,
        source: snapshot.source,
      },

      structure: {
        totalFiles: snapshot.totalFiles,
        totalDirectories: snapshot.totalDirectories,
        importantFiles,
        files: filePaths,
      },

      technology: {
        language: technology.language,
        frameworks: technology.frameworks,
        technologies: technology.technologies,
        packageManager: technology.packageManager,
        buildTool: technology.buildTool,
        typescript: technology.typescript,
        evidence: technology.evidence,
      },

      components: {
        controllers: components.controllers,
        services: components.services,
        repositories: components.repositories,
        models: components.models,
        frontendComponents: components.frontendComponents,
        modules: components.modules,
        routes: components.routes,
      },

      architecture,

      apis,

      functionalSummary: functional.summary,

      findings,

      recommendations,

      risks,

      codeSamples,
    };
  }

  private async resolveManifests(
    snapshot: RepositorySnapshot,
    filePaths: string[],
  ): Promise<ManifestContents> {
    const manifests: ManifestContents = {};

    const packageJsonPath = this.pickManifestPath(filePaths, 'package.json');
    if (packageJsonPath) {
      const raw = await snapshot.getContent(packageJsonPath);
      if (raw) {
        try {
          manifests.packageJson = JSON.parse(raw) as PackageJson;
          manifests.packageJsonPath = packageJsonPath;
        } catch {
          // package.json inválido/no parseable: se ignora sin romper el análisis
        }
      }
    }

    const singleManifestTargets: [keyof ManifestContents, string][] = [
      ['pomXml', 'pom.xml'],
      ['buildGradle', 'build.gradle'],
      ['requirementsTxt', 'requirements.txt'],
      ['pyprojectToml', 'pyproject.toml'],
      ['goMod', 'go.mod'],
      ['cargoToml', 'Cargo.toml'],
      ['composerJson', 'composer.json'],
      ['gemfile', 'Gemfile'],
    ];

    for (const [key, fileName] of singleManifestTargets) {
      const path = this.pickManifestPath(filePaths, fileName);
      if (path) {
        const raw = await snapshot.getContent(path);
        if (raw) {
          manifests[key] = raw;
        }
      }
    }

    const csprojPath = filePaths.find((p) =>
      p.toLowerCase().endsWith('.csproj'),
    );
    if (csprojPath) {
      const raw = await snapshot.getContent(csprojPath);
      if (raw) manifests.csproj = raw;
    }

    return manifests;
  }

  private pickManifestPath(
    filePaths: string[],
    fileName: string,
  ): string | null {
    const candidates = filePaths.filter(
      (p) => p.split('/').pop()?.toLowerCase() === fileName.toLowerCase(),
    );

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => a.split('/').length - b.split('/').length);
    return candidates[0];
  }

  private isRelevantCodeFile(path: string): boolean {
    const normalizedPath = path.toLowerCase();

    if (/(^|\/)(test|tests|__tests__)(\/|$)/i.test(normalizedPath)) {
      return false;
    }
    const fileName = path.split('/').pop() ?? '';

    if (fileName.toLowerCase() === 'readme.md') return false;

    if (
      [
        'package.json',
        'tsconfig.json',
        'nest-cli.json',
        'angular.json',
        'vite.config.ts',
        'vite.config.js',
        'next.config.js',
        'next.config.ts',
        'schema.prisma',
      ].includes(fileName)
    ) {
      return true;
    }

    if (!RELEVANT_EXTENSIONS.test(fileName)) return false;

    return RELEVANT_NAME_PATTERNS.some((pattern) => pattern.test(fileName));
  }

  private async readFiles(
    snapshot: RepositorySnapshot,
    paths: string[],
    maxLength: number,
  ): Promise<{ path: string; content: string }[]> {
    const results: { path: string; content: string }[] = [];
    const BATCH_SIZE = 10;

    for (let i = 0; i < paths.length; i += BATCH_SIZE) {
      const batch = paths.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (path) => {
          const content = await snapshot.getContent(path);
          return content
            ? { path, content: content.slice(0, maxLength) }
            : null;
        }),
      );

      for (const result of batchResults) {
        if (result) results.push(result);
      }
    }

    return results;
  }
}
