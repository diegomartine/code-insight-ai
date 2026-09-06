import { Injectable } from '@nestjs/common';
import { filterSourceFiles } from './source-files.util';

export interface ComponentResult {
  controllers: string[];
  services: string[];
  repositories: string[];
  models: string[];
  frontendComponents: string[];
  modules: string[];
  routes: string[];
  evidence: string[];
}

/**
 * Detecta componentes por convenciones de nombres y, cuando es posible,
 * por contenido del archivo.
 *
 * Soporta:
 * - NestJS
 * - Angular
 * - React
 * - Spring
 * - .NET
 * - Django / Flask / FastAPI
 */
@Injectable()
export class ComponentAnalyzerService {
  analyze(filePaths: string[]): ComponentResult {
    const sourceFiles = filterSourceFiles(filePaths);

    const productionSourceFiles = sourceFiles.filter((file) => {
      const normalized = file.toLowerCase();

      return !/(^|\/)(test|tests|__tests__)(\/|$)/i.test(normalized);
    });

    const evidence: string[] = [];

    // ---------------------------------------------------------
    // Controllers
    // ---------------------------------------------------------

    const controllers = productionSourceFiles.filter((file) => {
      const f = file.toLowerCase();

      return (
        f.endsWith('.controller.ts') || // NestJS
        /controller\.(java|cs)$/.test(f) || // Spring / .NET
        f.endsWith('_controller.py') // Django / Flask
      );
    });

    // ---------------------------------------------------------
    // Services
    // ---------------------------------------------------------

    const services = productionSourceFiles.filter((file) => {
      const f = file.toLowerCase();

      return (
        f.endsWith('.service.ts') || // NestJS / Angular
        /service\.(java|cs)$/.test(f)
      );
    });

    // ---------------------------------------------------------
    // Repositories
    // ---------------------------------------------------------

    const repositories = productionSourceFiles.filter((file) => {
      const f = file.toLowerCase();

      return (
        f.endsWith('.repository.ts') ||
        f.includes('/repository/') ||
        f.includes('/repositories/') ||
        /repository\.(java|cs)$/.test(f)
      );
    });

    // ---------------------------------------------------------
    // Models / Entities
    // ---------------------------------------------------------

    const models = productionSourceFiles.filter((file) => {
      const f = file.toLowerCase();
      const fileName = f.split('/').pop() ?? '';

      return (
        fileName.endsWith('.model.ts') ||
        fileName.endsWith('.entity.ts') ||
        fileName === 'schema.prisma' ||
        f.includes('/models/') ||
        f.includes('/entities/') ||
        /entity\.(java|cs)$/.test(f) ||
        fileName.endsWith('models.py')
      );
    });

    // ---------------------------------------------------------
    // Frontend Components
    // ---------------------------------------------------------

    const frontendComponents = productionSourceFiles.filter((file) => {
      const f = file.toLowerCase();

      // Angular tradicional:
      // user.component.ts
      if (f.endsWith('.component.ts') || f.endsWith('.component.tsx')) {
        return true;
      }

      // React:
      // components/User.tsx
      // components/User.jsx
      if (
        f.includes('/components/') &&
        (f.endsWith('.tsx') || f.endsWith('.jsx'))
      ) {
        return true;
      }

      /*
       * Angular moderno:
       *
       * app.ts
       * header.ts
       * footer.ts
       * login-page.ts
       *
       * No podemos considerar cualquier .ts como componente.
       *
       * Para evitar falsos positivos usamos:
       * - ubicación dentro de componentes/pages/features
       * - nombres habituales de Angular
       * - archivos conocidos como app.ts
       */
      if (f.endsWith('.ts')) {
        const isAngularLocation =
          /(^|\/)(components?|pages?|features?|views?|layouts?)(\/|$)/i.test(f);

        const isAngularComponentName =
          /(^|\/)(app|.*-page|.*-component|.*-view|.*-layout|.*-shell)\.ts$/i.test(
            f,
          );

        if (isAngularLocation || isAngularComponentName) {
          return true;
        }
      }

      return false;
    });

    // ---------------------------------------------------------
    // Angular Modules / NestJS Modules
    // ---------------------------------------------------------

    const modules = productionSourceFiles.filter((file) =>
      file.toLowerCase().endsWith('.module.ts'),
    );

    // ---------------------------------------------------------
    // Routes
    // ---------------------------------------------------------

    const routes = productionSourceFiles.filter((file) => {
      const f = file.toLowerCase();
      const fileName = f.split('/').pop() ?? '';

      return (
        /(^|\/)routes\//.test(f) ||
        fileName.endsWith('.routes.ts') ||
        fileName.endsWith('.routes.js') ||
        fileName.endsWith('.routes.tsx') ||
        fileName.endsWith('.routes.jsx') ||
        fileName.endsWith('.route.ts') ||
        fileName.endsWith('.route.js') ||
        fileName.endsWith('.route.tsx') ||
        fileName.endsWith('.route.jsx') ||
        fileName === 'routes.py' ||
        fileName === 'route.py'
      );
    });

    // ---------------------------------------------------------
    // Evidence
    // ---------------------------------------------------------

    if (controllers.length > 0) {
      evidence.push(`${controllers.length} controllers detectados`);
    }

    if (services.length > 0) {
      evidence.push(`${services.length} services detectados`);
    }

    if (repositories.length > 0) {
      evidence.push(`${repositories.length} repositories detectados`);
    }

    if (models.length > 0) {
      evidence.push(`${models.length} models/entities detectados`);
    }

    if (frontendComponents.length > 0) {
      evidence.push(
        `${frontendComponents.length} componentes de frontend detectados`,
      );
    }

    if (modules.length > 0) {
      evidence.push(`${modules.length} modules detectados`);
    }

    if (routes.length > 0) {
      evidence.push(`${routes.length} archivos de rutas detectados`);
    }

    return {
      controllers,
      services,
      repositories,
      models,
      frontendComponents,
      modules,
      routes,
      evidence,
    };
  }
}
