import { TechnologyDetectorService } from './technology-detector.service';

describe('TechnologyDetectorService', () => {
  const service = new TechnologyDetectorService();

  it('detects NestJS from package.json dependencies (Node ecosystem)', () => {
    const result = service.detect(
      ['src/app.module.ts', 'package.json'],
      {
        packageJson: { dependencies: { '@nestjs/core': '^11.0.0' } },
        packageJsonPath: 'package.json',
      },
      null,
    );

    expect(result.frameworks).toContain('NestJS');
    expect(result.evidence.some((e) => e.includes('@nestjs/core'))).toBe(true);
  });

  it('detects Spring Boot from pom.xml content — a completely different stack, proving genericity', () => {
    const result = service.detect(
      ['pom.xml', 'src/main/java/com/example/demo/DemoApplication.java'],
      {
        pomXml: `<project><dependencies>
          <dependency><artifactId>spring-boot-starter-web</artifactId></dependency>
        </dependencies></project>`,
      },
      'Java',
    );

    expect(result.language).toBe('Java');
    expect(result.frameworks).toContain('Spring Boot');
  });

  it('detects FastAPI from requirements.txt content', () => {
    const result = service.detect(
      ['requirements.txt', 'app/main.py'],
      { requirementsTxt: 'fastapi==0.110.0\nuvicorn==0.29.0\nsqlalchemy==2.0.0' },
      null,
    );

    expect(result.language).toBe('Python');
    expect(result.frameworks).toContain('FastAPI');
    expect(result.technologies).toContain('SQLAlchemy');
  });

  it('does not invent a framework when there is no manifest evidence', () => {
    const result = service.detect(['README.md'], {}, null);
    expect(result.frameworks).toEqual([]);
  });
});
