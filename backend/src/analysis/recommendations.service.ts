import { Injectable } from '@nestjs/common';
import { hasTestFiles } from './source-files.util';
import { ComponentResult } from './component-analyzer.service';
import { ApiResult } from './api-analyzer.service';
import { ArchitectureResult } from './architecture-analyzer.service';

@Injectable()
export class RecommendationsService {
  build(params: {
    filePaths: string[];
    components: ComponentResult;
    apis: ApiResult;
    architecture: ArchitectureResult;
  }): string[] {
    const { filePaths, components, apis, architecture } = params;

    const recommendations: string[] = [];

    // ---------------------------------------------------------
    // Backend / frontend
    // ---------------------------------------------------------

    const hasBackend =
      components.controllers.length > 0 || apis.backend.total > 0;

    // ---------------------------------------------------------
    // Tests
    // ---------------------------------------------------------

    const hasTests = hasTestFiles(filePaths);

    if (!hasTests) {
      recommendations.push(
        'Se recomienda agregar pruebas automatizadas para reducir el riesgo de regresiones.',
      );
    }

    // ---------------------------------------------------------
    // README
    // ---------------------------------------------------------

    const hasReadme = filePaths.some((f) => f.toLowerCase() === 'readme.md');

    if (!hasReadme) {
      recommendations.push(
        'Falta documentación técnica; se recomienda agregar o completar el README.',
      );
    }

    // ---------------------------------------------------------
    // Repository
    // Solo aplica cuando existe evidencia de backend
    // ---------------------------------------------------------

    if (
      hasBackend &&
      components.repositories.length === 0 &&
      components.services.length > 0
    ) {
      recommendations.push(
        'Se recomienda separar responsabilidades introduciendo una capa de repositories en el backend.',
      );
    }

    // ---------------------------------------------------------
    // Services / lógica de negocio
    // Solo aplica cuando existe backend
    // ---------------------------------------------------------

    if (
      hasBackend &&
      components.services.length > components.controllers.length * 2 &&
      components.controllers.length > 0
    ) {
      recommendations.push(
        'Se detectó lógica potencialmente concentrada en services; se recomienda evaluar su descomposición.',
      );
    }

    // ---------------------------------------------------------
    // APIs
    // ---------------------------------------------------------

    if (apis.endpoints.length > 0) {
      recommendations.push(
        'Se recomienda documentar las APIs (por ejemplo, con OpenAPI/Swagger) si aún no cuentan con documentación formal.',
      );
    }

    // ---------------------------------------------------------
    // Variables de entorno
    // ---------------------------------------------------------

    const envFiles = filePaths.some((f) => {
      const name = f.split('/').pop()?.toLowerCase() ?? '';

      return name === '.env' || name.startsWith('.env.');
    });

    if (envFiles) {
      recommendations.push(
        'Se recomienda centralizar y auditar la configuración sensible, y confirmar que los archivos .env estén excluidos del control de versiones.',
      );
    }

    // ---------------------------------------------------------
    // Arquitectura
    // ---------------------------------------------------------

    if (architecture.confidence < 0.5) {
      recommendations.push(
        'Se recomienda revisar manualmente la arquitectura detectada debido a su bajo nivel de confianza.',
      );
    }

    // ---------------------------------------------------------
    // Manejo de errores
    // ---------------------------------------------------------

    recommendations.push(
      'Se recomienda revisar el manejo de errores en los distintos flujos, especialmente en integraciones externas.',
    );

    return recommendations;
  }
}
