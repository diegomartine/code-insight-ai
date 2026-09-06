import { Injectable } from '@nestjs/common';
import { hasTestFiles } from './source-files.util';
import { ComponentResult } from './component-analyzer.service';
import { TechnologyResult } from './technology-detector.service';
import { ArchitectureResult } from './architecture-analyzer.service';
import { ApiResult } from './api-analyzer.service';
import { FunctionalAnalysisResult } from './functional-analysis.service';

@Injectable()
export class FindingsService {
  build(params: {
    filePaths: string[];
    importantFiles: string[];
    components: ComponentResult;
    technology: TechnologyResult;
    architecture: ArchitectureResult;
    apis: ApiResult;
    functional: FunctionalAnalysisResult;
  }): string[] {
    const {
      filePaths,
      importantFiles,
      components,
      technology,
      architecture,
      apis,
      functional,
    } = params;

    const findings: string[] = [];

    // ---------------------------------------------------------
    // Stack
    // ---------------------------------------------------------

    if (technology.frameworks.length > 0) {
      findings.push(
        `Frameworks detectados: ${technology.frameworks.join(', ')}`,
      );
    }

    if (technology.technologies.length > 0) {
      findings.push(
        `Tecnologías detectadas: ${technology.technologies.join(', ')}`,
      );
    }

    // ---------------------------------------------------------
    // Componentes backend
    // ---------------------------------------------------------

    if (components.controllers.length > 0) {
      findings.push(`${components.controllers.length} controllers detectados`);
    }

    if (components.services.length > 0) {
      findings.push(`${components.services.length} services detectados`);
    }

    if (components.repositories.length > 0) {
      findings.push(
        `${components.repositories.length} repositories detectados`,
      );
    }

    // ---------------------------------------------------------
    // Componentes frontend
    // ---------------------------------------------------------

    if (components.frontendComponents.length > 0) {
      findings.push(
        `${components.frontendComponents.length} componentes frontend detectados`,
      );
    }

    if (components.models.length > 0) {
      findings.push(`${components.models.length} models/entities detectados`);
    }

    if (components.routes.length > 0) {
      findings.push(
        `${components.routes.length} archivos de routing detectados`,
      );
    }

    // ---------------------------------------------------------
    // APIs
    // ---------------------------------------------------------

    if (apis.endpoints.length > 0) {
      findings.push(`${apis.endpoints.length} endpoints backend detectados`);
    }

    if (apis.frontend.total > 0) {
      findings.push(
        `${apis.frontend.total} archivo(s) de frontend con consumo de APIs detectados`,
      );
    }

    // ---------------------------------------------------------
    // Backend vs frontend
    // ---------------------------------------------------------

    const hasBackend =
      components.controllers.length > 0 || apis.backend.total > 0;

    const hasFrontend =
      components.frontendComponents.length > 0 ||
      apis.frontend.total > 0 ||
      technology.frameworks.some(
        (framework) => framework.toLowerCase() === 'angular',
      );

    /*
     * Repository es una recomendación relevante para backend.
     *
     * NO debemos recomendarlo simplemente porque existe un Service
     * en Angular.
     */
    if (
      hasBackend &&
      components.repositories.length === 0 &&
      components.services.length > 0
    ) {
      findings.push(
        'No se detectó una capa explícita de repositories en el backend; el acceso a datos puede estar concentrado en services.',
      );
    }

    /*
     * La concentración de services también se evalúa únicamente
     * cuando existe evidencia de backend.
     */
    if (
      hasBackend &&
      components.services.length > components.controllers.length * 2 &&
      components.controllers.length > 0
    ) {
      findings.push(
        'La cantidad de services supera ampliamente la de controllers, lo que puede indicar concentración de lógica de negocio.',
      );
    }

    // ---------------------------------------------------------
    // Información funcional
    // ---------------------------------------------------------

    if (functional.detectedModules.length > 0) {
      findings.push(
        `Módulos funcionales inferidos: ${functional.detectedModules.join(', ')}`,
      );
    }

    // ---------------------------------------------------------
    // Arquitectura
    // ---------------------------------------------------------

    findings.push(
      `Arquitectura detectada: ${architecture.pattern} (confianza ${architecture.confidence})`,
    );

    // ---------------------------------------------------------
    // Testing
    // ---------------------------------------------------------

    const hasTests = hasTestFiles(filePaths);

    if (!hasTests) {
      findings.push(
        'No se detectaron archivos de pruebas automatizadas (*.spec.*, *.test.*).',
      );
    } else {
      findings.push('Se detectaron archivos de pruebas automatizadas.');
    }

    // ---------------------------------------------------------
    // Documentación
    // ---------------------------------------------------------

    const hasReadme = filePaths.some((f) => f.toLowerCase() === 'readme.md');

    if (!hasReadme) {
      findings.push(
        'No se encontró un archivo README.md en la raíz del repositorio.',
      );
    }

    // ---------------------------------------------------------
    // Configuración
    // ---------------------------------------------------------

    if (importantFiles.length === 0) {
      findings.push('No se detectaron archivos de configuración principales.');
    }

    // ---------------------------------------------------------
    // NestJS / Angular modules
    // ---------------------------------------------------------

    if (components.modules.length > 0) {
      findings.push(
        `Se detectó una estructura modular (${components.modules.length} archivos *.module.ts).`,
      );
    }

    // ---------------------------------------------------------
    // Evitar variables sin uso
    // ---------------------------------------------------------

    void hasFrontend;

    return findings;
  }
}
