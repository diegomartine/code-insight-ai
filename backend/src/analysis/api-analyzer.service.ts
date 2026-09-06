import { Injectable } from '@nestjs/common';

interface CodeSample {
  path: string;
  content: string;
}

export interface DetectedEndpoint {
  method: string;
  path: string;
  file: string;
}

export interface ApiResult {
  backend: { detectedFiles: string[]; total: number };
  frontend: { detectedFiles: string[]; total: number };
  endpoints: DetectedEndpoint[];
  total: number;
}

@Injectable()
export class ApiAnalyzerService {
  analyze(codeSamples: CodeSample[]): ApiResult {
    const backendFiles = new Set<string>();
    const frontendFiles = new Set<string>();
    const endpoints: DetectedEndpoint[] = [];

    for (const sample of codeSamples) {
      if (!this.isSourceFile(sample.path)) {
        continue;
      }

      const path = sample.path.toLowerCase();

      if (this.isTestFile(path)) {
        continue;
      }

      const content = sample.content;

      // -------------------------
      // Backend
      // -------------------------

      this.detectNestJs(path, content, sample.path, endpoints, backendFiles);

      this.detectExpress(path, content, sample.path, endpoints, backendFiles);

      this.detectSpring(path, content, sample.path, endpoints, backendFiles);

      this.detectDotNet(path, content, sample.path, endpoints, backendFiles);

      this.detectPython(path, content, sample.path, endpoints, backendFiles);

      // -------------------------
      // Frontend
      // -------------------------

      if (this.hasFrontendHttpCall(content)) {
        frontendFiles.add(sample.path);
      }

      // React / React Router
      if (this.hasReactRouter(content)) {
        frontendFiles.add(sample.path);
      }
    }

    return {
      backend: {
        detectedFiles: Array.from(backendFiles),
        total: backendFiles.size,
      },
      frontend: {
        detectedFiles: Array.from(frontendFiles),
        total: frontendFiles.size,
      },
      endpoints,
      total: endpoints.length,
    };
  }

  // ---------------------------------------------------------
  // NestJS
  // ---------------------------------------------------------

  private detectNestJs(
    path: string,
    content: string,
    originalPath: string,
    endpoints: DetectedEndpoint[],
    backendFiles: Set<string>,
  ) {
    if (!path.endsWith('.controller.ts')) {
      return;
    }

    const controllerMatch = content.match(
      /@Controller\s*\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/,
    );

    if (!controllerMatch) {
      return;
    }

    const controllerPath = controllerMatch[1] ?? '';

    const endpointRegex =
      /@(Get|Post|Put|Patch|Delete|Options|Head)\s*\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/g;

    let match: RegExpExecArray | null;
    let found = false;

    while ((match = endpointRegex.exec(content)) !== null) {
      found = true;

      const route = match[2] ?? '';

      endpoints.push({
        method: match[1].toUpperCase(),
        path: this.joinRoutes(controllerPath, route),
        file: originalPath,
      });
    }

    if (found) {
      backendFiles.add(originalPath);
    }
  }

  // ---------------------------------------------------------
  // Express
  // ---------------------------------------------------------

  private detectExpress(
    path: string,
    content: string,
    originalPath: string,
    endpoints: DetectedEndpoint[],
    backendFiles: Set<string>,
  ) {
    const regex =
      /\b(?:router|app)\.(get|post|put|patch|delete|options|head)\s*\(\s*['"`]([^'"`]*)['"`]/gi;

    let match: RegExpExecArray | null;
    let found = false;

    while ((match = regex.exec(content)) !== null) {
      found = true;

      endpoints.push({
        method: match[1].toUpperCase(),
        path: this.normalizeRoute(match[2]),
        file: originalPath,
      });
    }

    if (found) {
      backendFiles.add(originalPath);
    }
  }

  // ---------------------------------------------------------
  // Spring
  // ---------------------------------------------------------

  private detectSpring(
    path: string,
    content: string,
    originalPath: string,
    endpoints: DetectedEndpoint[],
    backendFiles: Set<string>,
  ) {
    if (!path.endsWith('.java')) {
      return;
    }

    if (!/@(Rest)?Controller\b/.test(content)) {
      return;
    }

    const classPathMatch = content.match(
      /@RequestMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']*)["']/,
    );

    const basePath = classPathMatch?.[1] ?? '';

    const mappingRegex =
      /@(Get|Post|Put|Patch|Delete)Mapping\s*\(\s*(?:value\s*=\s*)?["']?([^"')]*)["']?\s*\)/g;

    let match: RegExpExecArray | null;
    let found = false;

    while ((match = mappingRegex.exec(content)) !== null) {
      found = true;

      const route = match[2] ?? '';

      endpoints.push({
        method: match[1].toUpperCase(),
        path: this.joinRoutes(basePath, route),
        file: originalPath,
      });
    }

    if (found) {
      backendFiles.add(originalPath);
    }
  }

  // ---------------------------------------------------------
  // .NET
  // ---------------------------------------------------------

  private detectDotNet(
    path: string,
    content: string,
    originalPath: string,
    endpoints: DetectedEndpoint[],
    backendFiles: Set<string>,
  ) {
    if (!path.endsWith('.cs')) {
      return;
    }

    if (!/\[ApiController\]|:\s*Controller(Base)?\b/.test(content)) {
      return;
    }

    const routeMatch = content.match(/\[Route\s*\(\s*"([^"]*)"\s*\)\]/);

    const basePath = routeMatch?.[1] ?? '';

    const attrRegex =
      /\[Http(Get|Post|Put|Patch|Delete)(?:\s*\(\s*"([^"]*)"\s*\))?\]/g;

    let match: RegExpExecArray | null;
    let found = false;

    while ((match = attrRegex.exec(content)) !== null) {
      found = true;

      const route = match[2] ?? '';

      endpoints.push({
        method: match[1].toUpperCase(),
        path: this.joinRoutes(basePath, route),
        file: originalPath,
      });
    }

    if (found) {
      backendFiles.add(originalPath);
    }
  }

  // ---------------------------------------------------------
  // Python
  // ---------------------------------------------------------

  private detectPython(
    path: string,
    content: string,
    originalPath: string,
    endpoints: DetectedEndpoint[],
    backendFiles: Set<string>,
  ) {
    if (!path.endsWith('.py')) {
      return;
    }

    let found = false;

    // FastAPI
    const fastApiRegex =
      /@(?:app|router)\.(get|post|put|patch|delete)\s*\(\s*["']([^"']*)["']/g;

    let match: RegExpExecArray | null;

    while ((match = fastApiRegex.exec(content)) !== null) {
      found = true;

      endpoints.push({
        method: match[1].toUpperCase(),
        path: this.normalizeRoute(match[2]),
        file: originalPath,
      });
    }

    // Flask
    const flaskRegex =
      /@app\.route\s*\(\s*["']([^"']*)["']\s*(?:,\s*methods\s*=\s*\[([^\]]*)\])?\)/g;

    while ((match = flaskRegex.exec(content)) !== null) {
      found = true;

      const route = match[1];

      const methods = match[2]
        ? match[2]
            .split(',')
            .map((method) => method.replace(/['"]/g, '').trim().toUpperCase())
        : ['GET'];

      for (const method of methods) {
        endpoints.push({
          method,
          path: this.normalizeRoute(route),
          file: originalPath,
        });
      }
    }

    if (found) {
      backendFiles.add(originalPath);
    }
  }

  // ---------------------------------------------------------
  // Frontend HTTP
  // ---------------------------------------------------------

  private hasFrontendHttpCall(content: string): boolean {
    return (
      /\baxios\.(get|post|put|patch|delete)\s*[<(]/i.test(content) ||
      /\baxios\.create\s*\(/i.test(content) ||
      /\bfetch\s*\(/i.test(content) ||
      /\bHttpClient\b/.test(content) ||
      /\bapi\.(get|post|put|patch|delete)\s*[<(]/i.test(content)
    );
  }

  // ---------------------------------------------------------
  // React Router
  // ---------------------------------------------------------

  private hasReactRouter(content: string): boolean {
    return (
      /\bBrowserRouter\b/.test(content) ||
      /\bRoutes\b/.test(content) ||
      /\bRoute\b/.test(content) ||
      /\buseNavigate\b/.test(content) ||
      /\buseParams\b/.test(content) ||
      /\bcreateBrowserRouter\b/.test(content) ||
      /\bRouterProvider\b/.test(content)
    );
  }

  // ---------------------------------------------------------
  // Route helpers
  // ---------------------------------------------------------

  private joinRoutes(...parts: string[]): string {
    const validParts = parts
      .filter((part) => part !== undefined && part !== null)
      .map((part) => String(part).trim())
      .filter(Boolean);

    if (validParts.length === 0) {
      return '/';
    }

    return this.normalizeRoute(validParts.join('/'));
  }

  private normalizeRoute(route: string): string {
    if (!route || !route.trim()) {
      return '/';
    }

    let normalized = route.trim();

    if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`;
    }

    normalized = normalized.replace(/\/+/g, '/');

    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  }

  // ---------------------------------------------------------
  // File detection
  // ---------------------------------------------------------

  private isSourceFile(path: string): boolean {
    return /\.(js|jsx|ts|tsx|java|cs|py|go|rb|php)$/i.test(path);
  }

  private isTestFile(path: string): boolean {
    const normalized = path.toLowerCase();

    return (
      /(^|\/)(test|tests|__tests__)(\/|$)/i.test(normalized) ||
      normalized.endsWith('.spec.ts') ||
      normalized.endsWith('.spec.js') ||
      normalized.endsWith('.spec.tsx') ||
      normalized.endsWith('.spec.jsx') ||
      normalized.endsWith('.test.ts') ||
      normalized.endsWith('.test.js') ||
      normalized.endsWith('.test.tsx') ||
      normalized.endsWith('.test.jsx')
    );
  }
}
