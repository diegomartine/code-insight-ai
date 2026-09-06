import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { RepositoryModule } from '../repository/repository.module';
import { ComponentAnalyzerService } from './component-analyzer.service';
import { ArchitectureAnalyzerService } from './architecture-analyzer.service';
import { ApiAnalyzerService } from './api-analyzer.service';
import { TechnologyDetectorService } from './technology-detector.service';
import { FunctionalAnalysisService } from './functional-analysis.service';
import { FindingsService } from './findings.service';
import { RisksService } from './risks.service';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [RepositoryModule],
  controllers: [AnalysisController],
  providers: [
    AnalysisService,
    ComponentAnalyzerService,
    ArchitectureAnalyzerService,
    ApiAnalyzerService,
    TechnologyDetectorService,
    FunctionalAnalysisService,
    FindingsService,
    RisksService,
    RecommendationsService,
  ],
})
export class AnalysisModule {}
