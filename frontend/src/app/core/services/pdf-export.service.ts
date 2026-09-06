import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { AnalysisResponse } from '../models/analysis.model';

const MARGIN_X = 18;
const PAGE_WIDTH = 210; // A4 mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const PAGE_HEIGHT = 297;
const BOTTOM_MARGIN = 20;
const MAX_CODE_SAMPLES_IN_PDF = 5;
const MAX_ITEMS_PER_LIST = 25;

/**
 * Construye y descarga el PDF del análisis actualmente cargado en el
 * frontend. Todo ocurre en el navegador con jsPDF — el PDF nunca se envía
 * al backend ni se persiste en ningún lado.
 */
@Injectable({ providedIn: 'root' })
export class PdfExportService {
  private doc!: jsPDF;
  private y = 0;

  export(result: AnalysisResponse): void {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4' });
    this.y = 20;

    this.renderCoverHeader(result);
    this.renderRepositorySection(result);
    this.renderSummarySection(result);
    this.renderFunctionalSection(result);
    this.renderTechnologySection(result);
    this.renderComponentsSection(result);
    this.renderArchitectureSection(result);
    this.renderApiSection(result);
    this.renderListSection('Findings', result.findings);
    this.renderListSection('Risks', result.risks);
    this.renderListSection('Recommendations', result.recommendations);
    this.renderCodeSamplesSection(result);
    this.renderFooter();

    const safeName = result.repository.name.replace(/[^a-z0-9-_]+/gi, '-');
    this.doc.save(`code-insight-ai-${safeName}.pdf`);
  }

  // ---------- bloques de contenido ----------

  private renderCoverHeader(result: AnalysisResponse): void {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(22);
    this.doc.setTextColor(30, 27, 75);
    this.doc.text('CODE INSIGHT AI', MARGIN_X, this.y);
    this.y += 8;

    this.doc.setFontSize(13);
    this.doc.setTextColor(79, 70, 229);
    this.doc.text('Repository Analysis Report', MARGIN_X, this.y);
    this.y += 4;

    this.doc.setDrawColor(228, 231, 236);
    this.doc.line(MARGIN_X, this.y, PAGE_WIDTH - MARGIN_X, this.y);
    this.y += 10;
  }

  private renderRepositorySection(result: AnalysisResponse): void {
    this.sectionTitle('Repository');
    this.keyValue('Project name', result.repository.name);
    this.keyValue('URL', result.repository.url ?? 'N/A');
    this.keyValue('Source', result.repository.source === 'github' ? 'GitHub' : 'ZIP upload');
    this.y += 4;
  }

  private renderSummarySection(result: AnalysisResponse): void {
    this.sectionTitle('Summary');
    this.keyValue('Language', result.technology.language ?? 'No determinado');
    this.keyValue(
      'Framework',
      result.technology.frameworks.length ? result.technology.frameworks.join(', ') : 'No determinado',
    );
    this.keyValue('Files', String(result.structure.totalFiles));
    this.keyValue('Directories', String(result.structure.totalDirectories));
    this.keyValue('Endpoints', String(result.apis.endpoints.length));
    this.y += 4;
  }

  private renderFunctionalSection(result: AnalysisResponse): void {
    this.sectionTitle('Functional Analysis');
    this.paragraph(result.functionalSummary || 'Sin resumen funcional disponible.');
    this.y += 4;
  }

  private renderTechnologySection(result: AnalysisResponse): void {
    this.sectionTitle('Technologies');
    this.keyValue('Package manager', result.technology.packageManager ?? 'No determinado');
    this.keyValue('Build tool', result.technology.buildTool ?? 'No determinado');
    this.keyValue('TypeScript', result.technology.typescript ? 'Sí' : 'No');
    this.bulletList(result.technology.technologies, 'Sin tecnologías adicionales detectadas.');
    this.y += 4;
  }

  private renderComponentsSection(result: AnalysisResponse): void {
    this.sectionTitle('Components');
    const c = result.components;
    this.keyValue('Controllers', String(c.controllers.length));
    this.keyValue('Services', String(c.services.length));
    this.keyValue('Repositories', String(c.repositories.length));
    this.keyValue('Models', String(c.models.length));
    this.keyValue('Frontend components', String(c.frontendComponents.length));
    this.keyValue('Modules', String(c.modules.length));
    this.keyValue('Routes', String(c.routes.length));
    this.y += 4;
  }

  private renderArchitectureSection(result: AnalysisResponse): void {
    this.sectionTitle('Architecture');
    this.keyValue('Pattern', result.architecture.pattern);
    this.keyValue('Confidence', `${Math.round(result.architecture.confidence * 100)}%`);
    this.subTitle('Evidence');
    this.bulletList(result.architecture.evidence, 'Sin evidencia registrada.');
    this.y += 4;
  }

  private renderApiSection(result: AnalysisResponse): void {
    this.sectionTitle('APIs');
    this.keyValue('Backend files', String(result.apis.backend.total));
    this.keyValue('Frontend files', String(result.apis.frontend.total));

    if (!result.apis.endpoints.length) {
      this.paragraph('No se detectaron endpoints backend.');
    } else {
      for (const ep of result.apis.endpoints.slice(0, MAX_ITEMS_PER_LIST)) {
        this.ensureSpace(6);
        this.doc.setFont('courier', 'normal');
        this.doc.setFontSize(9);
        this.doc.setTextColor(27, 29, 41);
        this.doc.text(`${ep.method.padEnd(6)} ${ep.path}`, MARGIN_X, this.y);
        this.y += 5;
      }
      if (result.apis.endpoints.length > MAX_ITEMS_PER_LIST) {
        this.paragraph(`… y ${result.apis.endpoints.length - MAX_ITEMS_PER_LIST} endpoint(s) adicionales.`);
      }
    }
    this.y += 4;
  }

  private renderListSection(title: string, items: string[]): void {
    this.sectionTitle(title);
    this.bulletList(items, `No hay ${title.toLowerCase()} para mostrar.`);
    this.y += 4;
  }

  private renderCodeSamplesSection(result: AnalysisResponse): void {
    if (!result.codeSamples.length) return;

    this.sectionTitle('Evidence / Code Samples');
    this.paragraph('Fragmentos limitados incluidos como evidencia (no el código fuente completo).');

    for (const sample of result.codeSamples.slice(0, MAX_CODE_SAMPLES_IN_PDF)) {
      this.ensureSpace(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(9.5);
      this.doc.setTextColor(79, 70, 229);
      this.doc.text(sample.path, MARGIN_X, this.y);
      this.y += 5;

      const snippet = sample.content.split('\n').slice(0, 6).join('\n');
      this.doc.setFont('courier', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(75, 81, 98);
      const lines = this.doc.splitTextToSize(snippet, CONTENT_WIDTH) as string[];
      for (const line of lines) {
        this.ensureSpace(5);
        this.doc.text(line, MARGIN_X, this.y);
        this.y += 4;
      }
      this.y += 3;
    }
  }

  private renderFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(138, 144, 162);
      this.doc.text('Generated by Code Insight AI', MARGIN_X, PAGE_HEIGHT - 10);
      this.doc.text(`${i} / ${pageCount}`, PAGE_WIDTH - MARGIN_X - 10, PAGE_HEIGHT - 10);
    }
  }

  // ---------- helpers de bajo nivel ----------

  private sectionTitle(text: string): void {
    this.ensureSpace(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(13);
    this.doc.setTextColor(26, 29, 41);
    this.doc.text(text.toUpperCase(), MARGIN_X, this.y);
    this.y += 2;
    this.doc.setDrawColor(228, 231, 236);
    this.doc.line(MARGIN_X, this.y, PAGE_WIDTH - MARGIN_X, this.y);
    this.y += 7;
  }

  private subTitle(text: string): void {
    this.ensureSpace(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(75, 81, 98);
    this.doc.text(text, MARGIN_X, this.y);
    this.y += 5;
  }

  private keyValue(label: string, value: string): void {
    this.ensureSpace(6);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(75, 81, 98);
    this.doc.text(`${label}:`, MARGIN_X, this.y);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(26, 29, 41);
    this.doc.text(value, MARGIN_X + 38, this.y);
    this.y += 6;
  }

  private paragraph(text: string): void {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(26, 29, 41);
    const lines = this.doc.splitTextToSize(text, CONTENT_WIDTH) as string[];
    for (const line of lines) {
      this.ensureSpace(6);
      this.doc.text(line, MARGIN_X, this.y);
      this.y += 5.5;
    }
  }

  private bulletList(items: string[], emptyMessage: string): void {
    if (!items.length) {
      this.paragraph(emptyMessage);
      return;
    }

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(26, 29, 41);

    for (const item of items.slice(0, MAX_ITEMS_PER_LIST)) {
      const lines = this.doc.splitTextToSize(`•  ${item}`, CONTENT_WIDTH - 4) as string[];
      for (const line of lines) {
        this.ensureSpace(5.5);
        this.doc.text(line, MARGIN_X, this.y);
        this.y += 5;
      }
    }

    if (items.length > MAX_ITEMS_PER_LIST) {
      this.paragraph(`… y ${items.length - MAX_ITEMS_PER_LIST} más.`);
    }
  }

  private ensureSpace(height: number): void {
    if (this.y + height > PAGE_HEIGHT - BOTTOM_MARGIN) {
      this.doc.addPage();
      this.y = 20;
    }
  }
}
