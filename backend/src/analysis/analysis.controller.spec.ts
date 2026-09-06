jest.mock('@nestjs/axios', () => ({
  HttpService: jest.fn(),
}));
import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';

describe('AnalysisController', () => {
  let controller: AnalysisController;
  const analysisServiceMock = {
    analyzeFromGithub: jest.fn(),
    analyzeFromZip: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [{ provide: AnalysisService, useValue: analysisServiceMock }],
    }).compile();

    controller = module.get<AnalysisController>(AnalysisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates GitHub analysis to AnalysisService', async () => {
    await controller.analyzeRepository({
      repositoryUrl: 'https://github.com/owner/repo',
    });
    expect(analysisServiceMock.analyzeFromGithub).toHaveBeenCalledWith(
      'https://github.com/owner/repo',
    );
  });

  it('rejects upload without a file', () => {
    expect(() => controller.analyzeUploadedZip(undefined)).toThrow();
  });
});
