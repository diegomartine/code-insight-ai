import { Injectable } from '@nestjs/common';
import { ComponentResult } from './component-analyzer.service';
import { TechnologyResult } from './technology-detector.service';
import { ApiResult } from './api-analyzer.service';

// Palabras técnicas/estructurales que no representan un dominio de negocio.
const STRUCTURAL_STOPWORDS = new Set([
  'src',
  'app',
  'apps',
  'lib',
  'libs',
  'backend',
  'frontend',
  'server',
  'client',
  'common',
  'shared',
  'core',
  'utils',
  'util',
  'helpers',
  'config',
  'configuration',
  'dto',
  'dtos',
  'interfaces',
  'types',
  'models',
  'model',
  'entities',
  'entity',
  'controllers',
  'controller',
  'services',
  'service',
  'repositories',
  'repository',
  'modules',
  'module',
  'guards',
  'guard',
  'middlewares',
  'middleware',
  'pipes',
  'pipe',
  'filters',
  'filter',
  'decorators',
  'decorator',
  'tests',
  'test',
  'spec',
  'mocks',
  'mock',
  'fixtures',
  'assets',
  'public',
  'static',
  'components',
  'component',
  'pages',
  'page',
  'hooks',
  'layouts',
  'layout',
  'store',
  'stores',
  'api',
  'apis',
  'http',
  'infra',
  'infrastructure',
  'domain',
  'application',
  'main',
  'index',
  'node_modules',
  'dist',
  'build',
  'bin',
  'obj',
  'target',
  'scripts',
  'migrations',
  'seeders',
  'seed',
  'i18n',
  'locales',
  'styles',
  'css',
  'images',
  'img',
  'routes',
  'route',
  'views',
  'view',
  'schemas',
  'schema',
  'ports',
  'adapters',
  'com',
  'org',
  'net',
  'io',
  'java',
]);

// Paquetes raíz frecuentes en Java/Kotlin que no son dominios funcionales.
const JAVA_NAMESPACE_STOPWORDS = new Set([
  'springframework',
  'apache',
  'google',
  'fasterxml',
  'hibernate',
  'junit',
  'jakarta',
  'javax',
  'samples',
]);

export interface FunctionalAnalysisResult {
  summary: string;
  detectedModules: string[];
  evidence: string[];
}

@Injectable()
export class FunctionalAnalysisService {
  analyze(
    filePaths: string[],
    components: ComponentResult,
    technology: TechnologyResult,
    apis: ApiResult,
  ): FunctionalAnalysisResult {
    const detectedModules = this.extractDomainModules(components);

    const evidence: string[] = [];
    const sentences: string[] = [];

    // ---------------------------------------------------------
    // Identificación del stack
    // ---------------------------------------------------------

    const hasAngular = technology.frameworks.some(
      (framework) => framework.toLowerCase() === 'angular',
    );

    const hasReact = technology.frameworks.some(
      (framework) => framework.toLowerCase() === 'react',
    );

    const hasBackendFramework = technology.frameworks.some((framework) =>
      [
        'Express',
        'NestJS',
        'Fastify',
        'Spring',
        'Spring Boot',
        'Django',
        'Flask',
        'FastAPI',
      ].some(
        (backendFramework) =>
          framework.toLowerCase() === backendFramework.toLowerCase(),
      ),
    );

    // ---------------------------------------------------------
    // Backend real
    // ---------------------------------------------------------

    /*
     * components.routes NO significa automáticamente backend.
     *
     * En Angular o React:
     *
     *   app.routes.ts
     *   routes.ts
     *   App.tsx
     *
     * pueden representar routing del frontend.
     *
     * La evidencia backend debe venir de:
     *
     * - controllers
     * - endpoints backend
     * - framework backend
     *
     * Nunca exclusivamente de rutas frontend.
     */

    const hasBackendComponents =
      components.controllers.length > 0 || apis.backend.total > 0;

    const hasBackend =
      hasBackendComponents || (hasBackendFramework && !hasAngular && !hasReact);

    // ---------------------------------------------------------
    // Frontend real
    // ---------------------------------------------------------

    const hasFrontend =
      components.frontendComponents.length > 0 ||
      apis.frontend.total > 0 ||
      hasAngular ||
      hasReact;

    // ---------------------------------------------------------
    // Evidencia de frontend
    // ---------------------------------------------------------

    if (hasReact) {
      evidence.push('Se detectó React como framework frontend.');
    }

    if (hasAngular) {
      evidence.push('Se detectó Angular como framework frontend.');
    }

    if (apis.frontend.total > 0) {
      evidence.push(
        `Se detectaron ${apis.frontend.total} archivo(s) frontend con consumo de APIs.`,
      );
    }

    // ---------------------------------------------------------
    // Tipo de aplicación
    // ---------------------------------------------------------

    if (hasBackend && hasFrontend) {
      const endpointCount =
        apis.endpoints.length || components.controllers.length;

      sentences.push(
        `El repositorio contiene una aplicación full-stack, con un backend que expone ${endpointCount} endpoint(s) y un frontend que consume o integra sus servicios.`,
      );

      evidence.push('Se detectaron componentes de backend y de frontend.');
    } else if (hasBackend) {
      if (components.controllers.length > 0 || components.services.length > 0) {
        sentences.push(
          `El repositorio corresponde a un backend/API${
            technology.frameworks.length > 0
              ? ` desarrollado con ${technology.frameworks.join(', ')}`
              : ''
          }, organizado mediante ${components.controllers.length} controller(s) y ${components.services.length} service(s).`,
        );
      } else if (apis.backend.total > 0) {
        sentences.push(
          `El repositorio corresponde a un backend/API${
            technology.frameworks.length > 0
              ? ` basado en ${technology.frameworks.join(', ')}`
              : ''
          }, con ${apis.backend.total} archivo(s) asociado(s) a endpoints HTTP.`,
        );
      } else {
        sentences.push(
          `El repositorio corresponde a un proyecto backend/API${
            technology.frameworks.length > 0
              ? ` basado en ${technology.frameworks.join(', ')}`
              : ''
          }, aunque no se identificaron puntos de entrada HTTP mediante las muestras analizadas.`,
        );
      }

      evidence.push(
        'Se detectó estructura o tecnología asociada a backend/API.',
      );
    } else if (hasFrontend) {
      if (hasReact) {
        sentences.push(
          `El repositorio corresponde a una aplicación frontend desarrollada con React, compuesta por ${components.frontendComponents.length} componente(s).`,
        );

        if (apis.frontend.total > 0) {
          sentences.push(
            `La aplicación consume servicios HTTP mediante ${apis.frontend.total} archivo(s) de integración con APIs.`,
          );
        }

        evidence.push('Se detectó React junto con componentes de frontend.');

        if (apis.frontend.total > 0) {
          evidence.push('Se detectó consumo de APIs desde el frontend.');
        }
      } else if (hasAngular) {
        sentences.push(
          `El repositorio corresponde a una aplicación frontend desarrollada con Angular, compuesta por ${components.frontendComponents.length} componente(s), ${components.services.length} service(s) y ${components.routes.length} archivo(s) de routing.`,
        );

        evidence.push(
          'Se detectó Angular junto con componentes, servicios o routing frontend.',
        );
      } else {
        sentences.push(
          `El repositorio corresponde a una aplicación de frontend${
            technology.frameworks.length > 0
              ? ` desarrollada con ${technology.frameworks.join(', ')}`
              : ''
          }, compuesta por ${components.frontendComponents.length} componente(s).`,
        );

        evidence.push(
          'Se detectaron componentes de frontend sin backend evidente.',
        );
      }
    } else {
      sentences.push(
        'No se encontró evidencia suficiente para determinar si el repositorio corresponde a un backend, un frontend o una librería.',
      );
    }

    // ---------------------------------------------------------
    // Módulos funcionales
    // ---------------------------------------------------------

    if (detectedModules.length > 0) {
      sentences.push(
        `A partir de componentes de código organizados por dominio se identificaron las siguientes áreas funcionales: ${detectedModules.join(', ')}.`,
      );

      evidence.push(
        `Áreas funcionales inferidas a partir de carpetas asociadas a componentes: ${detectedModules.join(', ')}`,
      );
    } else {
      evidence.push(
        'No se identificaron áreas funcionales de negocio con suficiente evidencia estructural.',
      );
    }

    // ---------------------------------------------------------
    // Persistencia
    // ---------------------------------------------------------

    const dbTechnologies = technology.technologies.filter((item) =>
      /postgres|mysql|mongo|sqlite|sql server/i.test(item),
    );

    if (dbTechnologies.length === 1) {
      sentences.push(
        `Se detectó ${dbTechnologies[0]} como tecnología de persistencia.`,
      );
    } else if (dbTechnologies.length > 1) {
      sentences.push(
        `Se detectaron tecnologías de persistencia declaradas: ${dbTechnologies.join(', ')}.`,
      );
    }

    return {
      summary: sentences.join(' '),
      detectedModules,
      evidence,
    };
  }

  /**
   * Infiere áreas funcionales únicamente a partir de archivos
   * que fueron identificados como componentes del sistema.
   */
  private extractDomainModules(components: ComponentResult): string[] {
    const componentGroups = [
      components.controllers,
      components.services,
      components.repositories,
      components.models,
      components.frontendComponents,
      components.routes,
    ];

    const componentPaths = componentGroups.flat();

    if (componentPaths.length === 0) {
      return [];
    }

    const frequency = new Map<string, number>();

    for (const path of componentPaths) {
      const segments = path
        .split('/')
        .map((segment) => segment.trim())
        .filter(Boolean);

      if (segments.length < 2) {
        continue;
      }

      const parentSegments = segments.slice(0, -1);

      const candidate = this.findBestDomainSegment(parentSegments);

      if (!candidate) {
        continue;
      }

      if (STRUCTURAL_STOPWORDS.has(candidate)) {
        continue;
      }

      frequency.set(candidate, (frequency.get(candidate) ?? 0) + 1);
    }

    return Array.from(frequency.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => {
        if (b[1] !== a[1]) {
          return b[1] - a[1];
        }

        return a[0].localeCompare(b[0]);
      })
      .slice(0, 8)
      .map(([segment]) => segment);
  }

  /**
   * Busca desde el directorio más cercano al componente hacia arriba
   * hasta encontrar un segmento que pueda representar un dominio.
   */
  private findBestDomainSegment(parentSegments: string[]): string | null {
    for (let i = parentSegments.length - 1; i >= 0; i--) {
      const normalized = parentSegments[i].toLowerCase().replace(/\\/g, '');

      if (normalized.length < 3) {
        continue;
      }

      if (STRUCTURAL_STOPWORDS.has(normalized)) {
        continue;
      }

      if (JAVA_NAMESPACE_STOPWORDS.has(normalized)) {
        continue;
      }

      if (/^v\d+$/.test(normalized)) {
        continue;
      }

      if (
        normalized === 'com' ||
        normalized === 'org' ||
        normalized === 'net' ||
        normalized === 'io'
      ) {
        continue;
      }

      if (normalized.startsWith('.')) {
        continue;
      }

      return normalized;
    }

    return null;
  }
}
