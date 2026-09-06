jest.mock('@nestjs/axios', () => ({
  HttpService: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisService } from './analysis.service';
import { GithubRepositoryLoaderService } from '../repository/github-repository-loader.service';
import { ZipRepositoryLoaderService } from '../repository/zip-repository-loader.service';
import { ComponentAnalyzerService } from './component-analyzer.service';
import { ArchitectureAnalyzerService } from './architecture-analyzer.service';
import { ApiAnalyzerService } from './api-analyzer.service';
import { TechnologyDetectorService } from './technology-detector.service';
import { FunctionalAnalysisService } from './functional-analysis.service';
import { FindingsService } from './findings.service';
import { RisksService } from './risks.service';
import { RecommendationsService } from './recommendations.service';

describe('AnalysisService', () => {
  let service: AnalysisService;

  const snapshot = {
    source: 'github' as const,
    metadata: { name: 'demo-repo', language: 'TypeScript' },
    filePaths: ['src/app.controller.ts', 'package.json'],
    totalFiles: 2,
    totalDirectories: 1,
    getContent: jest.fn().mockResolvedValue(null),
  };

  const githubLoaderMock = { load: jest.fn().mockResolvedValue(snapshot) };
  const zipLoaderMock = { load: jest.fn().mockReturnValue(snapshot) };
  const componentAnalyzerMock = {
    analyze: jest.fn().mockReturnValue({
      controllers: [],
      services: [],
      repositories: [],
      models: [],
      frontendComponents: [],
      modules: [],
      routes: [],
      evidence: [],
    }),
  };
  const architectureAnalyzerMock = {
    analyze: jest
      .fn()
      .mockReturnValue({ pattern: 'Monolito', confidence: 0.5, evidence: [] }),
  };
  const apiAnalyzerMock = {
    analyze: jest.fn().mockReturnValue({
      backend: { detectedFiles: [], total: 0 },
      frontend: { detectedFiles: [], total: 0 },
      endpoints: [],
      total: 0,
    }),
  };
  const technologyDetectorMock = {
    detect: jest.fn().mockReturnValue({
      language: 'TypeScript',
      frameworks: [],
      technologies: [],
      packageManager: null,
      buildTool: null,
      typescript: true,
      evidence: [],
    }),
  };
  const functionalAnalysisMock = {
    analyze: jest.fn().mockReturnValue({
      summary: 'resumen',
      detectedModules: [],
      evidence: [],
    }),
  };
  const findingsMock = { build: jest.fn().mockReturnValue([]) };
  const risksMock = { build: jest.fn().mockReturnValue([]) };
  const recommendationsMock = { build: jest.fn().mockReturnValue([]) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisService,
        { provide: GithubRepositoryLoaderService, useValue: githubLoaderMock },
        { provide: ZipRepositoryLoaderService, useValue: zipLoaderMock },
        { provide: ComponentAnalyzerService, useValue: componentAnalyzerMock },
        {
          provide: ArchitectureAnalyzerService,
          useValue: architectureAnalyzerMock,
        },
        { provide: ApiAnalyzerService, useValue: apiAnalyzerMock },
        {
          provide: TechnologyDetectorService,
          useValue: technologyDetectorMock,
        },
        {
          provide: FunctionalAnalysisService,
          useValue: functionalAnalysisMock,
        },
        { provide: FindingsService, useValue: findingsMock },
        { provide: RisksService, useValue: risksMock },
        { provide: RecommendationsService, useValue: recommendationsMock },
      ],
    }).compile();

    service = module.get<AnalysisService>(AnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('produces the expected top-level contract for a GitHub analysis', async () => {
    const result = await service.analyzeFromGithub(
      'https://github.com/owner/repo',
    );

    expect(githubLoaderMock.load).toHaveBeenCalledWith(
      'https://github.com/owner/repo',
    );
    expect(Object.keys(result)).toEqual(
      expect.arrayContaining([
        'status',
        'repository',
        'structure',
        'technology',
        'components',
        'architecture',
        'apis',
        'functionalSummary',
        'findings',
        'recommendations',
        'risks',
        'codeSamples',
      ]),
    );
    expect(result.repository.source).toBe('github');
  });

  it('produces a result for a ZIP analysis', async () => {
    const result = await service.analyzeFromZip(Buffer.from('PK'), 'demo.zip');
    expect(zipLoaderMock.load).toHaveBeenCalled();
    expect(result.status).toBe('analysis_completed');
  });
});
