import { Injectable } from '@nestjs/common';
import { filterSourceFiles } from './source-files.util';
import { ComponentResult } from './component-analyzer.service';
import { ApiResult } from './api-analyzer.service';

export interface ArchitectureResult {
  pattern: string;
  confidence: number;
  evidence: string[];
}

@Injectable()
export class ArchitectureAnalyzerService {
  analyze(
    filePaths: string[],
    components: ComponentResult,
    apiResult?: ApiResult,
  ): ArchitectureResult {
    const sourceFiles = filterSourceFiles(filePaths).map((f) =>
      f.toLowerCase(),
    );

    const evidence: string[] = [];

    // ---------------------------------------------------------
    // Stack / componentes
    // ---------------------------------------------------------

    const hasControllers = components.controllers.length > 0;
    const hasServices = components.services.length > 0;
    const hasRepositories = components.repositories.length > 0;
    const hasModules = components.modules.length > 0;
    const hasFrontendComponents = components.frontendComponents.length > 0;

    const hasBackendApi = (apiResult?.backend.total ?? 0) > 0;
    const hasFrontendApi = (apiResult?.frontend.total ?? 0) > 0;

    const hasAngularFiles = sourceFiles.some(
      (f) =>
        f.endsWith('angular.json') ||
        f.endsWith('.component.ts') ||
        f.endsWith('.routes.ts'),
    );

    /*
     * IMPORTANTE:
     *
     * components.routes puede contener:
     *
     * Angular:
     *   app.routes.ts
     *   auth.routes.ts
     *
     * Backend:
     *   routes.js
     *   routes.ts
     *   routes.py
     *
     * Por eso `hasRoutes` NO puede utilizarse directamente
     * como evidencia de backend.
     */
    const hasFrontendRouting =
      hasAngularFiles &&
      components.routes.some((file) =>
        file.toLowerCase().endsWith('.routes.ts'),
      );

    const hasBackendRouting =
      !hasFrontendRouting && components.routes.length > 0;

    // ---------------------------------------------------------
    // Clean / Hexagonal
    // ---------------------------------------------------------

    const hasDomainFolders = sourceFiles.some(
      (f) =>
        f.includes('/domain/') ||
        f.includes('/application/') ||
        f.includes('/infrastructure/'),
    );

    const hasPortsAdapters = sourceFiles.some(
      (f) => f.includes('/ports/') || f.includes('/adapters/'),
    );

    // ---------------------------------------------------------
    // Múltiples aplicaciones / monorepo
    // ---------------------------------------------------------

    const topLevelManifestDirs = new Set(
      filePaths
        .filter((f) => {
          const lower = f.toLowerCase();

          return (
            lower.endsWith('package.json') ||
            lower.endsWith('pom.xml') ||
            lower.endsWith('requirements.txt') ||
            lower.endsWith('.csproj')
          );
        })
        .map((f) => f.split('/').slice(0, -1).join('/'))
        .filter((dir) => dir.split('/').length <= 2),
    );

    const hasMultipleApps = topLevelManifestDirs.size > 1;

    // ---------------------------------------------------------
    // Clasificación
    // ---------------------------------------------------------

    let pattern = 'Monolito';
    let confidence = 0.5;

    // ---------------------------------------------------------
    // Frontend Angular
    // ---------------------------------------------------------

    if (hasFrontendComponents && !hasControllers && !hasBackendApi) {
      pattern = 'Monolito';
      confidence = 0.65;

      evidence.push(
        'Se detectó una aplicación frontend estructurada mediante componentes',
      );

      if (hasAngularFiles) {
        evidence.push('Se detectó estructura y routing propios de Angular');
      }

      if (hasFrontendRouting) {
        evidence.push('Se detectaron archivos de routing frontend de Angular');
      }

      if (hasServices) {
        evidence.push(
          'Se detectaron Services utilizados como parte de la estructura frontend',
        );
      }

      if (hasFrontendApi) {
        evidence.push(
          `Se detectaron ${apiResult?.frontend.total ?? 0} archivo(s) frontend con consumo de APIs`,
        );
      }
    }

    // ---------------------------------------------------------
    // Clean Architecture
    // ---------------------------------------------------------
    else if (hasDomainFolders) {
      pattern = 'Clean Architecture';
      confidence = 0.9;

      evidence.push(
        'Se detectaron carpetas domain/application/infrastructure, características de Clean Architecture',
      );
    }

    // ---------------------------------------------------------
    // Hexagonal Architecture
    // ---------------------------------------------------------
    else if (hasPortsAdapters) {
      pattern = 'Hexagonal Architecture';
      confidence = 0.9;

      evidence.push(
        'Se detectaron carpetas ports/adapters, características de arquitectura hexagonal',
      );
    }

    // ---------------------------------------------------------
    // N-Capas / Modular Monolith
    // ---------------------------------------------------------
    else if (hasControllers && hasServices) {
      pattern = 'N-Capas / Modular Monolith';
      confidence = 0.85;

      evidence.push('Se detectaron Controllers');
      evidence.push('Se detectaron Services');

      if (hasRepositories) {
        evidence.push('Se detectaron Repositories');
      } else {
        evidence.push(
          'No se detectó una capa explícita de Repositories separada de Services',
        );
      }

      if (hasModules) {
        evidence.push(
          'Se detectó una estructura modular mediante archivos *.module.ts',
        );
      }
    }

    // ---------------------------------------------------------
    // API Monolith
    // ---------------------------------------------------------
    else if (hasControllers) {
      pattern = 'API Monolith';
      confidence = 0.7;

      evidence.push('Se detectaron Controllers sin una capa de Services clara');

      if (hasBackendApi) {
        evidence.push(
          `Se detectaron ${apiResult?.backend.total ?? 0} archivo(s) backend con endpoints HTTP`,
        );
      }
    }

    // ---------------------------------------------------------
    // Backend con rutas pero sin controllers
    // ---------------------------------------------------------
    else if (hasBackendRouting || hasBackendApi) {
      pattern = 'Monolito';
      confidence = 0.65;

      if (hasBackendRouting) {
        evidence.push(
          'Se detectaron archivos de rutas asociados a la capa backend',
        );
      }

      if (hasBackendApi) {
        evidence.push(
          `Se detectaron ${apiResult?.backend.total ?? 0} archivo(s) backend con endpoints HTTP`,
        );
      }

      evidence.push(
        'La aplicación presenta una estructura backend HTTP centralizada sin evidencia suficiente de separación en múltiples servicios',
      );
    }

    // ---------------------------------------------------------
    // Proyecto sin patrón claro
    // ---------------------------------------------------------
    else {
      confidence = 0.3;

      if (hasFrontendComponents) {
        evidence.push(
          'Se detectaron componentes frontend, pero no suficiente evidencia para identificar un patrón arquitectónico específico',
        );
      } else {
        evidence.push(
          'No se encontró suficiente evidencia (controllers/services/domain) para identificar un patrón arquitectónico específico',
        );
      }
    }

    // ---------------------------------------------------------
    // Monorepo / múltiples aplicaciones
    // ---------------------------------------------------------

    if (hasMultipleApps) {
      evidence.push(
        `Se detectaron ${topLevelManifestDirs.size} subproyectos con manifiesto propio; podría tratarse de un enfoque de microservicios o un monorepo`,
      );
    }

    return {
      pattern,
      confidence: Math.round(confidence * 100) / 100,
      evidence,
    };
  }
}
