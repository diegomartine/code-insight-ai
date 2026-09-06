import { Injectable } from '@nestjs/common';

export interface ManifestContents {
  packageJson?: PackageJson;
  packageJsonPath?: string | null;
  pomXml?: string;
  buildGradle?: string;
  requirementsTxt?: string;
  pyprojectToml?: string;
  csproj?: string;
  goMod?: string;
  cargoToml?: string;
  composerJson?: string;
  gemfile?: string;
}

export interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface TechnologyResult {
  language: string | null;
  frameworks: string[];
  technologies: string[];
  packageManager: string | null;
  buildTool: string | null;
  typescript: boolean;
  evidence: string[];
}

interface EvidenceRule {
  test: RegExp;
  name: string;
}

const JAVA_FRAMEWORK_RULES: EvidenceRule[] = [
  { test: /spring-boot-starter/i, name: 'Spring Boot' },
  { test: /org\.springframework(?!\.boot)/i, name: 'Spring Framework' },
  { test: /quarkus/i, name: 'Quarkus' },
  { test: /micronaut/i, name: 'Micronaut' },
];

const JAVA_TECH_RULES: EvidenceRule[] = [
  {
    test: /spring-boot-starter-data-jpa|hibernate/i,
    name: 'JPA/Hibernate',
  },
  { test: /postgresql/i, name: 'PostgreSQL' },
  { test: /mysql-connector/i, name: 'MySQL' },
  { test: /junit/i, name: 'JUnit' },
  {
    test: /spring-boot-starter-security/i,
    name: 'Spring Security',
  },
  {
    test: /spring-boot-starter-web/i,
    name: 'REST API (Spring MVC)',
  },
];

const PYTHON_FRAMEWORK_RULES: EvidenceRule[] = [
  { test: /fastapi/i, name: 'FastAPI' },
  { test: /\bdjango\b/i, name: 'Django' },
  { test: /\bflask\b/i, name: 'Flask' },
];

const PYTHON_TECH_RULES: EvidenceRule[] = [
  { test: /sqlalchemy/i, name: 'SQLAlchemy' },
  { test: /psycopg2/i, name: 'PostgreSQL' },
  { test: /pymongo/i, name: 'MongoDB' },
  { test: /pytest/i, name: 'pytest' },
  { test: /celery/i, name: 'Celery' },
];

const DOTNET_FRAMEWORK_RULES: EvidenceRule[] = [
  { test: /Microsoft\.AspNetCore/i, name: 'ASP.NET Core' },
  { test: /Microsoft\.NET\.Sdk\.Web/i, name: 'ASP.NET Core' },
];

const DOTNET_TECH_RULES: EvidenceRule[] = [
  {
    test: /Microsoft\.EntityFrameworkCore/i,
    name: 'Entity Framework Core',
  },
  { test: /Npgsql/i, name: 'PostgreSQL' },
  { test: /Swashbuckle/i, name: 'Swagger/OpenAPI' },
];

const NODE_FRAMEWORK_DEPS: [string, string][] = [
  ['@nestjs/core', 'NestJS'],
  ['next', 'Next.js'],
  ['react', 'React'],
  ['react-dom', 'React'],
  ['@angular/core', 'Angular'],
  ['vue', 'Vue'],
  ['nuxt', 'Nuxt'],
  ['express', 'Express'],
  ['fastify', 'Fastify'],
  ['svelte', 'Svelte'],
];

const NODE_TECH_DEPS: [string, string][] = [
  ['@prisma/client', 'Prisma'],
  ['typeorm', 'TypeORM'],
  ['@nestjs/typeorm', 'TypeORM'],
  ['mongoose', 'MongoDB (Mongoose)'],
  ['@nestjs/mongoose', 'MongoDB (Mongoose)'],
  ['pg', 'PostgreSQL'],
  ['mysql2', 'MySQL'],
  ['sqlite3', 'SQLite'],
  ['axios', 'Axios'],
  ['vite', 'Vite'],
  ['jest', 'Jest'],
  ['mocha', 'Mocha'],
  ['cypress', 'Cypress'],
  ['playwright', 'Playwright'],
  ['graphql', 'GraphQL'],
  ['@nestjs/swagger', 'Swagger/OpenAPI'],
  ['tailwindcss', 'TailwindCSS'],
  ['jsonwebtoken', 'JWT'],
  ['passport', 'Passport.js'],
  ['redis', 'Redis'],
];

@Injectable()
export class TechnologyDetectorService {
  detect(
    filePaths: string[],
    manifests: ManifestContents,
    githubLanguage: string | null,
  ): TechnologyResult {
    const frameworks = new Set<string>();
    const technologies = new Set<string>();
    const evidence: string[] = [];

    // GitHub se utiliza únicamente como fallback.
    let language = githubLanguage;
    let typescript = false;

    const has = (fileName: string): boolean =>
      filePaths.some((p) => p.toLowerCase().endsWith(fileName.toLowerCase()));

    // ============================================================
    // Node.js / npm ecosystem
    // ============================================================
    if (manifests.packageJson) {
      evidence.push(
        `Se encontró ${manifests.packageJsonPath ?? 'package.json'}`,
      );

      const dependencies = {
        ...(manifests.packageJson.dependencies ?? {}),
        ...(manifests.packageJson.devDependencies ?? {}),
      };

      const packageName = String(
        manifests.packageJson.name ?? '',
      ).toLowerCase();

      if (packageName === 'express') {
        frameworks.add('Express');

        evidence.push(
          'El package.json corresponde al paquete "express" → Express',
        );
      }

      for (const [dep, name] of NODE_FRAMEWORK_DEPS) {
        if (dependencies[dep]) {
          frameworks.add(name);

          evidence.push(`Dependencia "${dep}" en package.json → ${name}`);
        }
      }

      for (const [dep, name] of NODE_TECH_DEPS) {
        if (dependencies[dep]) {
          technologies.add(name);

          evidence.push(`Dependencia "${dep}" en package.json → ${name}`);
        }
      }

      if (dependencies.typescript || has('tsconfig.json')) {
        typescript = true;
        language = 'TypeScript';

        technologies.add('TypeScript');

        evidence.push(
          'Se detectó TypeScript mediante package.json/tsconfig.json',
        );
      } else {
        language = 'JavaScript';
      }
    }

    // ============================================================
    // Java (Maven / Gradle)
    // ============================================================
    const javaManifest = manifests.pomXml ?? manifests.buildGradle;

    if (javaManifest) {
      // El manifiesto tiene prioridad sobre GitHub.
      language = 'Java';

      evidence.push(
        manifests.pomXml
          ? 'Se encontró pom.xml (Maven)'
          : 'Se encontró build.gradle (Gradle)',
      );

      applyRules(JAVA_FRAMEWORK_RULES, javaManifest, frameworks, evidence);

      applyRules(JAVA_TECH_RULES, javaManifest, technologies, evidence);
    } else if (
      has('pom.xml') ||
      has('build.gradle') ||
      has('build.gradle.kts')
    ) {
      language = 'Java';

      evidence.push(
        'Se encontró manifiesto de Maven/Gradle, pero no fue posible leer su contenido para inferir el framework',
      );
    }

    // ============================================================
    // Python
    // ============================================================
    const pythonManifest = manifests.requirementsTxt ?? manifests.pyprojectToml;

    if (pythonManifest) {
      // El manifiesto tiene prioridad sobre GitHub.
      language = 'Python';

      evidence.push(
        manifests.requirementsTxt
          ? 'Se encontró requirements.txt'
          : 'Se encontró pyproject.toml',
      );

      applyRules(PYTHON_FRAMEWORK_RULES, pythonManifest, frameworks, evidence);

      applyRules(PYTHON_TECH_RULES, pythonManifest, technologies, evidence);
    } else if (
      has('requirements.txt') ||
      has('pyproject.toml') ||
      has('pipfile')
    ) {
      language = 'Python';

      evidence.push(
        'Se encontró manifiesto de Python, pero no fue posible leer su contenido para inferir el framework',
      );
    }

    // ============================================================
    // .NET
    // ============================================================
    if (manifests.csproj) {
      language = 'C#';

      evidence.push('Se encontró un archivo .csproj');

      applyRules(
        DOTNET_FRAMEWORK_RULES,
        manifests.csproj,
        frameworks,
        evidence,
      );

      applyRules(DOTNET_TECH_RULES, manifests.csproj, technologies, evidence);
    } else if (filePaths.some((p) => p.toLowerCase().endsWith('.csproj'))) {
      language = 'C#';

      evidence.push(
        'Se encontró un archivo .csproj, pero no fue posible leer su contenido',
      );
    }

    // ============================================================
    // Go
    // ============================================================
    if (manifests.goMod) {
      language = 'Go';

      evidence.push('Se encontró go.mod');

      if (/gin-gonic\/gin/i.test(manifests.goMod)) {
        frameworks.add('Gin');

        evidence.push('Dependencia "gin-gonic/gin" en go.mod → Gin');
      }

      if (/labstack\/echo/i.test(manifests.goMod)) {
        frameworks.add('Echo');

        evidence.push('Dependencia "labstack/echo" en go.mod → Echo');
      }
    }

    // ============================================================
    // Rust
    // ============================================================
    if (has('cargo.toml')) {
      language = 'Rust';

      evidence.push('Se encontró Cargo.toml');
    }

    // ============================================================
    // PHP
    // ============================================================
    if (has('composer.json')) {
      language = 'PHP';

      evidence.push('Se encontró composer.json');
    }

    // ============================================================
    // Ruby
    // ============================================================
    if (has('gemfile')) {
      language = 'Ruby';

      evidence.push('Se encontró Gemfile');

      if (manifests.gemfile && /gem\s+['"]rails['"]/i.test(manifests.gemfile)) {
        frameworks.add('Ruby on Rails');

        evidence.push('Dependencia "rails" en Gemfile → Ruby on Rails');
      }
    }

    // ============================================================
    // Docker / infraestructura
    // ============================================================
    if (has('dockerfile')) {
      technologies.add('Docker');

      evidence.push('Se encontró Dockerfile');
    }

    if (has('docker-compose.yml') || has('docker-compose.yaml')) {
      technologies.add('Docker Compose');

      evidence.push('Se encontró docker-compose');
    }

    // ============================================================
    // Package manager
    // ============================================================
    const packageManagerResult = this.detectPackageManager(filePaths);

    if (packageManagerResult.evidence) {
      evidence.push(packageManagerResult.evidence);
    }

    // ============================================================
    // Build tool
    // ============================================================
    const buildTool = manifests.pomXml
      ? 'Maven'
      : manifests.buildGradle
        ? 'Gradle'
        : manifests.goMod
          ? 'Go Modules'
          : manifests.cargoToml
            ? 'Cargo'
            : manifests.composerJson
              ? 'Composer'
              : manifests.gemfile
                ? 'Bundler'
                : manifests.requirementsTxt || manifests.pyprojectToml
                  ? 'pip'
                  : has('vite.config.ts') ||
                      has('vite.config.js') ||
                      has('vite.config.mjs') ||
                      has('vite.config.cjs')
                    ? 'Vite'
                    : null;

    return {
      language,
      frameworks: Array.from(frameworks),
      technologies: Array.from(technologies),
      packageManager: packageManagerResult.manager,
      buildTool,
      typescript,
      evidence,
    };
  }

  private detectPackageManager(filePaths: string[]): {
    manager: string | null;
    evidence: string | null;
  } {
    const normalized = filePaths.map((f) => f.toLowerCase());

    if (normalized.some((f) => f.endsWith('pnpm-lock.yaml'))) {
      return {
        manager: 'pnpm',
        evidence: 'Se encontró pnpm-lock.yaml → pnpm',
      };
    }

    if (
      normalized.some(
        (f) => f.endsWith('yarn.lock') || f.endsWith('.yarnrc.yml'),
      )
    ) {
      return {
        manager: 'Yarn',
        evidence: 'Se encontró configuración de Yarn',
      };
    }

    if (normalized.some((f) => f.endsWith('package-lock.json'))) {
      return {
        manager: 'npm',
        evidence: 'Se encontró package-lock.json → npm',
      };
    }

    if (
      normalized.some((f) => f.endsWith('bun.lock') || f.endsWith('bun.lockb'))
    ) {
      return {
        manager: 'Bun',
        evidence: 'Se encontró bun.lock → Bun',
      };
    }

    if (normalized.some((f) => f.endsWith('package.json'))) {
      return {
        manager: 'npm (inferido)',
        evidence:
          'Se encontró package.json, pero no lockfile; npm se muestra como gestor probable',
      };
    }

    return {
      manager: null,
      evidence: null,
    };
  }
}

function applyRules(
  rules: EvidenceRule[],
  content: string,
  target: Set<string>,
  evidence: string[],
): void {
  for (const rule of rules) {
    if (rule.test.test(content) && !target.has(rule.name)) {
      target.add(rule.name);

      evidence.push(
        `Coincidencia de "${rule.test}" en manifiesto → ${rule.name}`,
      );
    }
  }
}
