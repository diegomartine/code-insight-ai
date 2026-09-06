import { Component, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AnalysisService } from '../../../core/services/analysis.service';
import { PdfExportService } from '../../../core/services/pdf-export.service';
import { AnalysisResponse } from '../../../core/models/analysis.model';
import { toFriendlyErrorMessage } from '../../../shared/utils/api-error.util';

import { RepositoryInputComponent } from '../repository-input/repository-input.component';
import { SummaryCardComponent } from '../analysis-summary/summary-card.component';
import { FunctionalSummaryComponent } from '../analysis-summary/functional-summary.component';
import { TechnologySectionComponent } from '../technology-section/technology-section.component';
import { ComponentsSectionComponent } from '../components-section/components-section.component';
import { ArchitectureSectionComponent } from '../architecture-section/architecture-section.component';
import { ApiSectionComponent } from '../api-section/api-section.component';
import { InsightsSectionComponent } from '../insights-section/insights-section.component';
import { CodeSamplesSectionComponent } from '../code-samples-section/code-samples-section.component';

type ViewState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'cia-analysis-page',
  standalone: true,
  imports: [
    RepositoryInputComponent,
    SummaryCardComponent,
    FunctionalSummaryComponent,
    TechnologySectionComponent,
    ComponentsSectionComponent,
    ArchitectureSectionComponent,
    ApiSectionComponent,
    InsightsSectionComponent,
    CodeSamplesSectionComponent,
  ],
  templateUrl: './analysis-page.component.html',
  styleUrl: './analysis-page.component.scss',
})
export class AnalysisPageComponent {
  readonly state = signal<ViewState>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly result = signal<AnalysisResponse | null>(null);

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly pdfExportService: PdfExportService,
  ) {}

  get isLoading(): boolean {
    return this.state() === 'loading';
  }

  onAnalyzeGithub(repositoryUrl: string): void {
    if (this.isLoading) return; // evita solicitudes concurrentes
    this.beginAnalysis();

    this.analysisService
      .analyzeGithubRepository(repositoryUrl)
      .pipe(finalize(() => this.finishIfStillLoading()))
      .subscribe({
        next: (response) => this.onSuccess(response),
        error: (err) => this.onError(err),
      });
  }

  onAnalyzeZip(file: File): void {
    if (this.isLoading) return;
    this.beginAnalysis();

    this.analysisService
      .analyzeZipFile(file)
      .pipe(finalize(() => this.finishIfStillLoading()))
      .subscribe({
        next: (response) => this.onSuccess(response),
        error: (err) => this.onError(err),
      });
  }

  exportPdf(): void {
    const current = this.result();
    if (!current) return;
    this.pdfExportService.export(current);
  }

  retry(): void {
    this.state.set('idle');
    this.errorMessage.set(null);
  }

  private beginAnalysis(): void {
    this.state.set('loading');
    this.errorMessage.set(null);
    this.result.set(null);
  }

  private onSuccess(response: AnalysisResponse): void {
    this.result.set(response);
    this.state.set('success');
  }

  private onError(error: unknown): void {
    this.errorMessage.set(toFriendlyErrorMessage(error));
    this.state.set('error');
  }

  /** finalize() corre incluso en éxito; solo forzamos 'error' si nadie más resolvió el estado. */
  private finishIfStillLoading(): void {
    if (this.state() === 'loading') {
      this.state.set('error');
      this.errorMessage.set('No fue posible analizar el repositorio.');
    }
  }
}
