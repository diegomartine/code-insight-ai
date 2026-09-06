# Code Insight AI

## Ingeniería Inversa Automatizada de Repositorios

Code Insight AI es una aplicación web que analiza repositorios de código y genera automáticamente una visión técnica y funcional del proyecto.

El usuario puede analizar un repositorio mediante:

* URL de un repositorio público de GitHub.
* Archivo ZIP.

El sistema realiza **análisis estático**, sin ejecutar el código analizado, y presenta los resultados en una interfaz web desarrollada con Angular.


## Problema

Comprender un repositorio existente puede requerir bastante tiempo cuando la documentación es limitada o inexistente.

Code Insight AI automatiza una primera etapa de ingeniería inversa para identificar:

* Tecnologías y frameworks.
* Estructura del proyecto.
* Componentes principales.
* APIs y rutas.
* Arquitectura probable.
* Descripción funcional.
* Hallazgos, riesgos y recomendaciones.



## Arquitectura

text
┌─────────────────────────────┐
│        Angular 20           │
│          Frontend           │
│                             │
│  Repository Input           │
│  Analysis Dashboard         │
│  Results / Insights         │
└──────────────┬──────────────┘
               │ HTTP
               ▼
┌─────────────────────────────┐
│        NestJS Backend       │
│                             │
│  Analysis Controller        │
│  Analysis Service           │
│                             │
│  GitHub Loader              │
│  ZIP Loader                 │
│                             │
│  Technology Analyzer        │
│  Component Analyzer         │
│  API Analyzer               │
│  Architecture Analyzer      │
│  Functional Analyzer        │
│  Findings / Risks           │
│  Recommendations            │
└─────────────────────────────┘


### Flujo

text
GitHub URL / ZIP
       ↓
Repository Loader
       ↓
Source Files
       ↓
Static Analysis
       ↓
Technology / Components / APIs
       ↓
Architecture + Functional Analysis
       ↓
Findings / Risks / Recommendations
       ↓
Angular Dashboard


## Tecnologías

### Backend

* Node.js
* NestJS
* TypeScript
* Axios
* Jest
* Swagger

### Frontend

* Angular 20
* TypeScript
* SCSS
* Angular Router
* HttpClient



## Funcionalidades

### Entrada

* Análisis mediante URL de GitHub.
* Análisis mediante archivo ZIP.

### Análisis automático

* Lenguaje principal.
* Framework principal.
* Build tool.
* Dependencias relevantes.
* Número aproximado de archivos.
* Controllers.
* Services.
* Repositories.
* Models / Entities.
* Frontend Components.
* Modules.
* Routes.
* APIs y endpoints.
* Consumo de APIs desde frontend.

### Arquitectura

El sistema infiere la arquitectura probable a partir de evidencias estructurales, incluyendo:

* Monolito.
* MVC.
* N-Capas.
* Clean Architecture.
* Hexagonal.
* Microservicios.

El resultado incluye nivel de confianza y evidencias encontradas.

### Insights

Genera automáticamente:

* Descripción funcional.
* Findings.
* Riesgos.
* Recomendaciones técnicas.

## Seguridad

El código analizado **no se ejecuta**.

Los archivos ZIP cuentan con controles para:

* Límite de tamaño.
* Límite de cantidad de archivos.
* Límite de tamaño individual.
* Protección contra Zip Slip / path traversal.

Solo deben utilizarse repositorios públicos o proyectos de prueba sin información sensible.

## Ejecución local

### Backend

bash
cd backend
npm install
npm run start:dev

API:

text
http://localhost:3000

Swagger:

text
http://localhost:3000/docs

### Frontend

En otra terminal:

bash
cd frontend
npm install
npm start

Aplicación:

text
http://localhost:4200

## API

### GitHub

http
POST /analysis


json
{
  "url": "https://github.com/nestjs/nest"
}

### ZIP

http
POST /analysis/upload

Recibe el archivo mediante `multipart/form-data`.

## Pruebas

Backend:
bash
cd backend
npm test
npm run build


## Documentación específica

* [Backend README](./backend/README.md)
* [Frontend README](./frontend/README.md)


## Supuestos y limitaciones

El análisis es estático y heurístico. La arquitectura y los componentes se infieren a partir de la evidencia disponible en la estructura y código fuente del repositorio.
La precisión depende de las convenciones utilizadas por el proyecto analizado.



## Mejoras futuras

* Integración con LLMs para enriquecer el análisis.
* Análisis mediante AST.
* Generación automática de diagramas de arquitectura.
* Análisis avanzado de dependencias.
* Detección de patrones de diseño.
* Análisis de deuda técnica.
* Soporte para más lenguajes y frameworks.
* Despliegue cloud.



## Autor

**Diego Martinez**

Proyecto desarrollado para el reto técnico:

**Code Insight AI – Ingeniería Inversa Automatizada de Repositorios**
