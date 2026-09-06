import { Injectable } from '@nestjs/common';
import { hasTestFiles } from './source-files.util';
import { ComponentResult } from './component-analyzer.service';
import { ArchitectureResult } from './architecture-analyzer.service';
import { ApiResult } from './api-analyzer.service';

interface CodeSample {
  path: string;
  content: string;
}

// Patrones amplios para identificar posibles secretos o credenciales
// hardcodeadas. Se utilizan únicamente como indicadores de riesgo
// que requieren revisión manual.
const SECRET_LIKE_PATTERNS: RegExp[] = [
  /(api[_-]?key|secret|password|passwd|token)\s*[:=]\s*['"][^'"]{6,}['"]/i,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----/,
];

@Injectable()
export class RisksService {
  build(params: {
    filePaths: string[];
    components: ComponentResult;
    architecture: ArchitectureResult;
    apis: ApiResult;
    codeSamples: CodeSample[];
  }): string[] {
    const { filePaths, components, architecture, apis, codeSamples } = params;

    const risks: string[] = [];

    const hasBackend =
      components.controllers.length > 0 || apis.backend.total > 0;

    if (!hasTestFiles(filePaths)) {
      risks.push(
        'No se detectaron pruebas automatizadas. Posible riesgo: regresiones podrían pasar desapercibidas. Se recomienda revisar la estrategia de testing.',
      );
    }

    const hasReadme = filePaths.some(
      (file) => file.toLowerCase() === 'readme.md',
    );

    if (!hasReadme) {
      risks.push(
        'No se encontró documentación técnica (README). Posible riesgo para la mantenibilidad del proyecto.',
      );
    }
    const envFiles = filePaths.filter((file) => {
      const name = file.split('/').pop()?.toLowerCase() ?? '';

      return (
        name === '.env' || (name.startsWith('.env.') && name !== '.env.example')
      );
    });

    if (envFiles.length > 0) {
      const preview = envFiles.slice(0, 3).join(', ');

      const suffix = envFiles.length > 3 ? '...' : '';

      risks.push(
        `Se detectaron ${envFiles.length} archivo(s) de tipo .env en el repositorio (${preview}${suffix}). Posible riesgo de exposición de configuración sensible si fueron versionados por error; se recomienda revisar el historial de git y el .gitignore.`,
      );
    }

    const filesWithPossibleSecrets = codeSamples.filter((sample) =>
      SECRET_LIKE_PATTERNS.some((pattern) => pattern.test(sample.content)),
    );

    if (filesWithPossibleSecrets.length > 0) {
      risks.push(
        `Se detectaron patrones que podrían corresponder a credenciales o llaves dentro de ${filesWithPossibleSecrets.length} archivo(s) analizados. No se pudo verificar si son valores reales o de ejemplo; se recomienda revisar manualmente.`,
      );
    }

    if (hasBackend && apis.endpoints.length > 0) {
      const authEvidence = codeSamples.some((sample) =>
        /@UseGuards|jwt|passport|@PreAuthorize|\[Authorize\]|authenticat|@login_required|permission_classes/i.test(
          sample.content,
        ),
      );

      if (!authEvidence) {
        risks.push(
          'Se detectaron endpoints backend pero no se pudo verificar evidencia de autenticación/autorización en las muestras de código analizadas. No se afirma que los endpoints estén desprotegidos; se recomienda revisarlo manualmente.',
        );
      }
    }

    const hasLockfile = filePaths.some((file) => {
      const normalized = file.toLowerCase();

      return (
        normalized.endsWith('package-lock.json') ||
        normalized.endsWith('yarn.lock') ||
        normalized.endsWith('pnpm-lock.yaml') ||
        normalized.endsWith('bun.lock') ||
        normalized.endsWith('bun.lockb')
      );
    });

    const hasPackageJson = filePaths.some((file) =>
      file.toLowerCase().endsWith('package.json'),
    );

    if (hasPackageJson && !hasLockfile) {
      risks.push(
        'No se detectó un archivo de lockfile (package-lock.json/yarn.lock/pnpm-lock.yaml/bun.lock). No fue posible verificar versiones exactas de dependencias ni vulnerabilidades conocidas.',
      );
    }

    if (architecture.confidence < 0.5) {
      risks.push(
        'La arquitectura detectada tiene baja confianza, lo que puede indicar una estructura no convencional o fuerte acoplamiento entre capas. Se recomienda revisión manual.',
      );
    }

    if (
      hasBackend &&
      components.repositories.length === 0 &&
      components.services.length > 3
    ) {
      risks.push(
        'Posible acoplamiento entre lógica de negocio y acceso a datos, al no existir una capa de repositories separada pese a la cantidad de services detectados.',
      );
    }

    return risks;
  }
}
