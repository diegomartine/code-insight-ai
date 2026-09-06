# Code Insight AI — Backend

Backend de **Code Insight AI**, una plataforma de ingeniería inversa automatizada de repositorios.

El sistema recibe un repositorio mediante una URL pública de GitHub o un archivo ZIP y analiza su estructura y código fuente para generar información técnica sobre:

- Tecnologías utilizadas
- Lenguajes y frameworks
- Componentes principales
- APIs y endpoints
- Arquitectura inferida
- Resumen funcional
- Hallazgos
- Riesgos
- Recomendaciones
- Evidencias encontradas en el repositorio

El análisis se basa en evidencia real del repositorio y no requiere ejecutar el código analizado.



## Arquitectura

El backend está desarrollado con **NestJS + TypeScript** y utiliza una arquitectura modular basada en servicios especializados.


                         ┌──────────────────────┐
                         │      Frontend        │
                         │       Angular        │
                         └──────────┬───────────┘
                                    │
                                    │ HTTP
                                    ▼
                         ┌──────────────────────┐
                         │  AnalysisController  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   AnalysisService    │
                         │ Orquestador principal│
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
      ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
      │ GitHub Loader │     │  ZIP Loader   │     │   Technology  │
      │               │     │               │     │   Detector    │
      └───────────────┘     └───────────────┘     └───────────────┘
                                                     
              ┌──────────────────────────────────────────────┐
              │              Analysis Engine                 │
              ├──────────────────────────────────────────────┤
              │ Component Analyzer                           │
              │ Architecture Analyzer                        │
              │ API Analyzer                                 │
              │ Functional Analysis                          │
              │ Findings                                     │
              │ Risks                                        │
              │ Recommendations                              │
              └──────────────────────────────────────────────┘


### Flujo de análisis


GitHub URL / ZIP
       │
       ▼
Carga del repositorio
       │
       ▼
Obtención de archivos
       │
       ▼
Filtrado de archivos fuente
       │
       ├──► Detección de tecnologías
       ├──► Detección de componentes
       ├──► Detección de APIs
       ├──► Inferencia de arquitectura
       └──► Análisis funcional
                │
                ▼
          Findings / Risks
                │
                ▼
        Recommendations
                │
                ▼
         Resultado JSON




## Stack tecnológico

### Backend

* Node.js
* NestJS
* TypeScript
* REST API
* Swagger / OpenAPI

### Análisis estático

El motor utiliza diferentes estrategias de detección:

* Convenciones de nombres de archivos
* Extensiones
* Dependencias declaradas
* Archivos de configuración
* Decoradores y anotaciones
* Estructura de directorios
* Definiciones de rutas
* Evidencia de consumo de APIs

No se ejecuta código del repositorio analizado.



## Capacidades de análisis

### Tecnologías

El detector identifica tecnologías a partir de archivos y manifiestos como:

* `package.json`
* `pom.xml`
* `build.gradle`
* `requirements.txt`
* `pyproject.toml`
* `.csproj`
* `go.mod`
* `Cargo.toml`
* `composer.json`
* `Gemfile`
* `Dockerfile`

También puede identificar frameworks y herramientas como:

* NestJS
* Express
* Angular
* React
* Next.js
* Spring Boot
* FastAPI
* Flask
* .NET
* Prisma
* TypeORM
* Jest
* Mocha
* Cypress
* Playwright
* Swagger / OpenAPI
* GraphQL
* TailwindCSS



### Componentes

El análisis busca evidencia de componentes típicos de diferentes ecosistemas:

| Tipo                | Ejemplos                                                   |
| - | - |
| Controllers         | `.controller.ts`, `Controller.java`, `Controller.cs`       |
| Services            | `.service.ts`, `Service.java`, `Service.cs`                |
| Repositories        | `.repository.ts`, carpetas `repository`, `Repository.java` |
| Models              | `.model.ts`, `.entity.ts`, `schema.prisma`, `models.py`    |
| Frontend Components | `.component.ts`, `.tsx`, `.jsx`                            |
| Modules             | `.module.ts`                                               |
| Routes              | `.routes.ts`, `.route.ts`, `routes.py`                     |

Las pruebas y carpetas de testing se excluyen del análisis de componentes de producción para evitar falsos positivos.



### APIs

El sistema detecta endpoints backend y consumo de APIs frontend.

Actualmente contempla patrones de:

* NestJS
* Express
* Spring
* .NET
* FastAPI
* Flask

También identifica consumo frontend mediante tecnologías como:

* Axios
* Fetch
* Angular HttpClient

Las rutas detectadas se normalizan para evitar inconsistencias como:


//users


y convertirlas en:


/users




## Arquitectura inferida

El motor intenta inferir patrones arquitectónicos a partir de evidencia estructural.

Actualmente contempla:

* Monolito
* MVC
* N-Capas
* Clean Architecture
* Hexagonal
* Microservicios

Cada resultado incluye un nivel de confianza y evidencia.

Ejemplo:

json
{
  "pattern": "Clean Architecture",
  "confidence": 0.78,
  "evidence": [
    "Se detectaron controllers",
    "Se detectaron services",
    "Se detectaron repositories",
    "Se identificaron capas separadas"
  ]
}


La confianza representa la cantidad y calidad de evidencia encontrada. Una arquitectura con poca evidencia se marca explícitamente con baja confianza en lugar de asumir una arquitectura no comprobada.



## Análisis funcional

El análisis funcional intenta inferir el propósito técnico del proyecto utilizando:

* Estructura de carpetas
* Nombres de módulos
* Controllers
* Services
* Components
* Endpoints
* Tecnologías detectadas

El sistema no inventa un dominio de negocio cuando no existe evidencia suficiente.

Por ejemplo, un repositorio puede producir:


Aplicación backend desarrollada con NestJS que expone
servicios HTTP organizados mediante controllers y services.


Mientras que una aplicación Angular puede producir:


Aplicación frontend desarrollada con Angular, compuesta
por componentes, services y archivos de routing.




## Findings, riesgos y recomendaciones

El resultado incluye tres niveles de análisis complementarios.

### Findings

Representan observaciones técnicas encontradas en el repositorio.

Ejemplos:

* Frameworks detectados
* Controllers encontrados
* Services encontrados
* Endpoints detectados
* Componentes frontend
* Módulos
* Routing
* Pruebas automatizadas

### Riesgos

El sistema identifica posibles riesgos técnicos, por ejemplo:

* Ausencia de pruebas
* Ausencia de README
* Archivos `.env`
* Posibles secretos hardcodeados
* Ausencia de lockfile
* Endpoints sin evidencia visible de autenticación
* Arquitectura con baja confianza
* Posible concentración de lógica en services

Los patrones relacionados con secretos solamente generan una alerta para revisión manual. El sistema no afirma que una credencial sea real ni devuelve el valor detectado.

### Recomendaciones

Las recomendaciones se generan según la evidencia encontrada.

Ejemplos:

* Agregar pruebas automatizadas
* Mejorar documentación
* Separar responsabilidades
* Documentar APIs
* Revisar configuración sensible
* Revisar arquitecturas con baja confianza
* Evaluar concentración de lógica de negocio



## Endpoints

### Analizar repositorio de GitHub

http
POST /analysis


Body:

json
{
  "repositoryUrl": "https://github.com/usuario/repositorio"
}


Ejemplo:

bash
curl -X POST http://localhost:3000/analysis \
  -H "Content-Type: application/json" \
  -d "{\"repositoryUrl\":\"https://github.com/nestjs/nest\"}"




### Analizar archivo ZIP

http
POST /analysis/upload


Content-Type:


multipart/form-data


Campo:


file


Ejemplo:

bash
curl -X POST http://localhost:3000/analysis/upload \
  -F "file=@repository.zip"


El backend valida que el archivo sea un ZIP y aplica límites de seguridad durante su procesamiento.



### Swagger / OpenAPI

La documentación interactiva de la API está disponible en:


http://localhost:3000/docs




## Variables de entorno

Crear un archivo `.env` en el backend:

env
PORT=3000
GITHUB_TOKEN=
CORS_ORIGIN=http://localhost:4200


### Variables

| Variable       | Requerida | Descripción                                                       |
| -- |  | -- |
| `PORT`         | No        | Puerto del servidor. Por defecto `3000`.                          |
| `GITHUB_TOKEN` | No        | Token de GitHub para aumentar el límite de solicitudes de la API. |
| `CORS_ORIGIN`  | No        | Orígenes permitidos separados por coma.                           |

Ejemplo:

env
CORS_ORIGIN=http://localhost:4200,https://mi-frontend.netlify.app


No se deben almacenar tokens reales ni secretos dentro del repositorio.



## Instalación

Clonar el proyecto:

bash
git clone <URL_DEL_REPOSITORIO>
cd Code-Insight-AI/backend


Instalar dependencias:

bash
npm install




## Ejecución

### Desarrollo

bash
npm run start


### Watch mode

bash
npm run start:dev


### Producción

bash
npm run build
npm run start:prod




## Pruebas

Ejecutar las pruebas unitarias:

bash
npm run test


Ejecutar pruebas E2E:

bash
npm run test:e2e


Generar cobertura:

bash
npm run test:cov


Antes de publicar cambios se recomienda ejecutar:

bash
npm run build
npm run test




## Seguridad

El backend aplica diferentes medidas para reducir riesgos durante el análisis de repositorios externos.

### ZIP

Se aplican controles sobre:

* Tamaño máximo del archivo comprimido
* Número máximo de entradas
* Tamaño máximo por archivo descomprimido
* Validación de formato ZIP
* Prevención de Zip Slip / path traversal
* No ejecución de archivos contenidos en el ZIP

### Código analizado

El repositorio analizado se trata como información estática.

El backend:

* No ejecuta código del repositorio
* No instala dependencias del repositorio
* No ejecuta scripts encontrados
* No ejecuta aplicaciones descargadas
* No requiere acceso a bases de datos del repositorio analizado



## Manejo de errores

El backend contempla errores comunes durante la carga desde GitHub:

* URL inválida
* Repositorio inexistente
* Repositorio no accesible
* Problemas de autenticación
* Rate limit de GitHub
* Timeouts
* Repositorios sin archivos analizables

Los errores se transforman en respuestas HTTP controladas para evitar exponer detalles internos innecesarios.



## Estructura del proyecto


backend/
├── src/
│   ├── analysis/
│   │   ├── analysis.controller.ts
│   │   ├── analysis.service.ts
│   │   ├── api-analyzer.service.ts
│   │   ├── architecture-analyzer.service.ts
│   │   ├── component-analyzer.service.ts
│   │   ├── findings.service.ts
│   │   ├── functional-analysis.service.ts
│   │   ├── recommendations.service.ts
│   │   ├── risks.service.ts
│   │   └── technology-detector.service.ts
│   │
│   ├── repository/
│   │   ├── github-repository-loader.service.ts
│   │   └── zip-repository-loader.service.ts
│   │
│   └── ...
│
├── test/
├── package.json
├── tsconfig.json
└── README.md


### Responsabilidades principales

| Servicio                        | Responsabilidad                            |
| - |  |
| `AnalysisService`               | Orquesta todo el proceso de análisis       |
| `GithubRepositoryLoaderService` | Obtiene repositorios públicos desde GitHub |
| `ZipRepositoryLoaderService`    | Procesa archivos ZIP                       |
| `TechnologyDetectorService`     | Detecta lenguaje, framework y tecnologías  |
| `ComponentAnalyzerService`      | Detecta componentes estructurales          |
| `ArchitectureAnalyzerService`   | Infiere arquitectura                       |
| `ApiAnalyzerService`            | Detecta APIs y consumo HTTP                |
| `FunctionalAnalysisService`     | Genera descripción funcional               |
| `FindingsService`               | Genera hallazgos                           |
| `RisksService`                  | Identifica posibles riesgos                |
| `RecommendationsService`        | Genera recomendaciones                     |



## Decisiones y supuestos

### 1. Análisis estático

Se decidió realizar análisis estático en lugar de ejecutar los repositorios analizados.

Esto permite analizar código de múltiples tecnologías sin instalar dependencias ni ejecutar software potencialmente inseguro.

### 2. Detección basada en evidencia

Las conclusiones se generan utilizando evidencia disponible en:

* nombres de archivos
* estructura de directorios
* dependencias
* configuraciones
* decoradores
* anotaciones
* rutas
* contenido de archivos fuente

### 3. Arquitectura con confianza

La arquitectura inferida no se presenta como una verdad absoluta.

Cuando existe poca evidencia, el resultado muestra una confianza baja y genera una recomendación de revisión manual.

### 4. Compatibilidad multi-framework

Aunque el backend está desarrollado con NestJS, el motor de análisis no está limitado a NestJS.

Se diseñó para reconocer patrones de diferentes ecosistemas como:

* Node.js
* Angular
* React
* Spring
* .NET
* Python



## Limitaciones actuales

El análisis es heurístico y no reemplaza una revisión manual de arquitectura.

Algunas estructuras no convencionales pueden no ser detectadas correctamente.

La detección de:

* arquitectura
* componentes
* autenticación
* secretos
* responsabilidades funcionales

se basa en evidencia disponible y puede producir falsos positivos o falsos negativos.

La herramienta reporta estas situaciones como indicios y recomendaciones, evitando afirmar información que no pueda comprobarse.



## Estado del proyecto

Actualmente el backend cuenta con:

* [x] Análisis mediante URL pública de GitHub
* [x] Análisis mediante ZIP
* [x] Detección de tecnologías
* [x] Detección de componentes
* [x] Detección de APIs
* [x] Inferencia de arquitectura
* [x] Análisis funcional
* [x] Findings
* [x] Riesgos
* [x] Recomendaciones
* [x] Evidencias
* [x] Muestras de código
* [x] Validaciones de seguridad para ZIP
* [x] Swagger/OpenAPI
* [x] Pruebas automatizadas
* [x] Build de producción





