import { FunctionalAnalysisService } from './functional-analysis.service';
import { ComponentResult } from './component-analyzer.service';
import { TechnologyResult } from './technology-detector.service';
import { ApiResult } from './api-analyzer.service';

function emptyApis(): ApiResult {
  return {
    backend: { detectedFiles: [], total: 0 },
    frontend: { detectedFiles: [], total: 0 },
    endpoints: [],
    total: 0,
  };
}

function tech(frameworks: string[] = []): TechnologyResult {
  return {
    language: 'TypeScript',
    frameworks,
    technologies: [],
    packageManager: 'npm',
    buildTool: null,
    typescript: true,
    evidence: [],
  };
}

describe('FunctionalAnalysisService (genericidad de dominio)', () => {
  const service = new FunctionalAnalysisService();

  it('infiere módulos de un e-commerce a partir de la estructura de carpetas, sin ninguna referencia fija a ese dominio', () => {
    const components: ComponentResult = {
      controllers: [
        'src/orders/orders.controller.ts',
        'src/products/products.controller.ts',
        'src/cart/cart.controller.ts',
      ],
      services: [
        'src/orders/orders.service.ts',
        'src/products/products.service.ts',
      ],
      repositories: [],
      models: ['src/orders/order.entity.ts'],
      frontendComponents: [],
      modules: [],
      routes: [],
      evidence: [],
    };

    const result = service.analyze(
      [...components.controllers, ...components.services, ...components.models],
      components,
      tech(['NestJS']),
      emptyApis(),
    );

    expect(result.detectedModules).toEqual(
      expect.arrayContaining(['orders', 'products']),
    );
    // Nunca debe aparecer un término de otro dominio (p. ej. nómina) que
    // no esté presente en la estructura analizada.
    expect(result.detectedModules).not.toContain('payroll');
  });

  it('infiere módulos distintos (nómina) para una estructura de carpetas distinta, con el mismo algoritmo', () => {
    const components: ComponentResult = {
      controllers: [
        'src/employees/employees.controller.ts',
        'src/payroll/payroll.controller.ts',
      ],
      services: ['src/employees/employees.service.ts', 'src/payroll/payroll.service.ts'],
      repositories: [],
      models: [],
      frontendComponents: [],
      modules: [],
      routes: [],
      evidence: [],
    };

    const result = service.analyze(
      [...components.controllers, ...components.services],
      components,
      tech(['NestJS']),
      emptyApis(),
    );

    expect(result.detectedModules).toEqual(
      expect.arrayContaining(['employees', 'payroll']),
    );
    expect(result.detectedModules).not.toContain('orders');
  });
});
