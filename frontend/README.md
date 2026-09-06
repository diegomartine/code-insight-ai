# Code Insight AI — Frontend

Frontend de **Code Insight AI**, una aplicación web para realizar ingeniería inversa automatizada de repositorios de código.

La aplicación permite ingresar un repositorio público de GitHub o cargar un archivo ZIP y visualizar el análisis generado por el backend.

El objetivo es presentar de forma clara información técnica sobre la estructura, tecnologías, componentes, APIs, arquitectura, funcionalidad, hallazgos, riesgos y recomendaciones del repositorio analizado.



## Tecnologías

- Angular 20
- TypeScript
- HTML5
- CSS3
- Angular Reactive Forms
- HttpClient
- Vite / Angular CLI



## Funcionalidades

### Análisis mediante GitHub

El usuario puede ingresar la URL pública de un repositorio:


https://github.com/usuario/repositorio

El frontend envía la solicitud al backend mediante:

http
POST /analysis




### Análisis mediante ZIP

También es posible cargar un repositorio comprimido en formato `.zip`.

El archivo se envía mediante:

http
POST /analysis/upload


utilizando:


multipart/form-data




## Información presentada

Después de completar el análisis, la interfaz muestra:

### Resumen

- Nombre del repositorio
- Fuente del análisis
- Cantidad de archivos
- Cantidad de directorios
- Resumen funcional

### Tecnologías

- Lenguaje principal
- Frameworks
- Tecnologías adicionales
- Package manager
- Build tool
- Uso de TypeScript

### Arquitectura

Se presenta la arquitectura inferida por el backend, por ejemplo:


Monolito
MVC
N-Capas
Clean Architecture
Hexagonal
Microservicios


También se muestra el nivel de confianza y la evidencia utilizada para realizar la inferencia.

### Componentes

La interfaz presenta los componentes detectados:

- Controllers
- Services
- Repositories
- Models / Entities
- Frontend Components
- Modules
- Routes

### APIs

Se muestran:

- Endpoints backend
- Archivos donde fueron detectados
- Consumo de APIs desde frontend
- Métodos HTTP y rutas cuando existe evidencia suficiente

### Hallazgos

Se presentan observaciones técnicas encontradas durante el análisis.

### Riesgos

Se muestran posibles riesgos relacionados con:

- Testing
- Documentación
- Configuración sensible
- Posibles secretos
- Lockfiles
- Autenticación
- Arquitectura

Los riesgos representan indicadores que requieren revisión técnica y no afirmaciones absolutas.

### Recomendaciones

El sistema presenta recomendaciones generadas a partir de la evidencia encontrada en el repositorio.

### Evidencias

La interfaz puede mostrar archivos relevantes y muestras de código utilizadas como evidencia del análisis.



## Arquitectura del frontend

La aplicación utiliza una estructura basada en componentes y servicios de Angular.


                         ┌──────────────────────┐
                         │       Usuario        │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    Angular UI        │
                         │                      │
                         │ Repository Input     │
                         │ ZIP Upload           │
                         │ Analysis Results     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    HTTP Service      │
                         └──────────┬───────────┘
                                    │
                                    │ HTTP/JSON
                                    ▼
                         ┌──────────────────────┐
                         │   Code Insight AI    │
                         │       Backend        │
                         └──────────────────────┘




## Flujo de usuario


1. Usuario ingresa URL de GitHub
              │
              ▼
2. Frontend valida la entrada
              │
              ▼
3. Envía POST /analysis
              │
              ▼
4. Backend analiza el repositorio
              │
              ▼
5. Backend devuelve resultado estructurado
              │
              ▼
6. Angular procesa la respuesta
              │
              ▼
7. Se muestran resultados del análisis


Para archivos ZIP:


1. Usuario selecciona ZIP
              │
              ▼
2. Frontend valida el archivo
              │
              ▼
3. Envía multipart/form-data
              │
              ▼
4. Backend procesa el ZIP
              │
              ▼
5. Backend ejecuta análisis estático
              │
              ▼
6. Angular muestra los resultados

## Integración con el backend

El frontend consume la API de Code Insight AI.

Durante desarrollo, la configuración utiliza la URL del backend definida mediante variables de entorno.

### Desarrollo

Archivo:

.env


Ejemplo:

env
VITE_API_URL=http://localhost:3000

La aplicación utiliza `/api` como base para sus solicitudes HTTP y el servidor de desarrollo puede utilizar el proxy configurado hacia el backend.

## Producción

Para producción se utiliza una configuración específica mediante:
.env.production
Ejemplo:

env
VITE_API_URL=https://tu-backend-url


La URL debe apuntar al backend desplegado.

No se deben incluir tokens privados ni credenciales en las variables `VITE_*`, ya que las variables de frontend quedan expuestas al navegador.

## Requisitos

Antes de ejecutar el frontend se requiere:

- Node.js
- npm
- Backend de Code Insight AI ejecutándose o desplegado

Comprobar versiones:

bash
node --version
npm --version

## Instalación

Desde la carpeta `frontend`:

bash
npm install

## Desarrollo

Ejecutar:

bash
npm start
La aplicación estará disponible normalmente en:
http://localhost:4200




## Build

Para generar la versión de producción:
bash
npm run build
Los archivos generados estarán dentro del directorio de salida de Angular.



## Validación antes de publicar
Se recomienda ejecutar:
bash
npm run build
para comprobar que el proyecto compila correctamente antes de realizar un despliegue.



## Estructura general


frontend/
├── src/
│   ├── app/
│   │   ├── ...
│   │   └── ...
│   │
│   ├── assets/
│   ├── index.html
│   ├── main.ts
│   └── styles.css
│
├── .env
├── .env.production
├── angular.json
├── package.json
├── tsconfig.json
└── README.md




## Comunicación con la API
El frontend utiliza solicitudes HTTP para comunicarse con el backend.
### GitHub

http
POST /analysis
Content-Type: application/json

Body:

json
{
  "repositoryUrl": "https://github.com/usuario/repositorio"
}


### ZIP

http
POST /analysis/upload
Content-Type: multipart/form-data


Campo:
file




## Manejo de estados
La interfaz contempla los principales estados del proceso:


Inicial
  │
  ▼
Repositorio seleccionado
  │
  ▼
Analizando
  │
  ├───────────────┐
  ▼               ▼
Éxito            Error
  │               │
  ▼               ▼
Resultados      Mensaje

Durante el análisis se informa al usuario que el repositorio está siendo procesado para evitar múltiples solicitudes accidentales.



## Manejo de errores

El frontend muestra errores cuando:
- La URL de GitHub no es válida.
- No se proporciona un repositorio.
- El archivo ZIP no es válido.
- El backend no está disponible.
- El repositorio no puede ser consultado.
- El backend devuelve un error durante el análisis.
Los detalles internos del backend no deben exponerse innecesariamente al usuario final.



## Diseño

La interfaz está orientada a una herramienta técnica de análisis de código.
La información se organiza por secciones para facilitar la lectura:


┌─────────────────────────────────────────┐
│           Code Insight AI               │
│                                         │
│  Repository URL / ZIP                   │
│  [____________________________]         │
│                                         │
│              [ Analizar ]               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Resumen del análisis                    │
├─────────────────────────────────────────┤
│ Tecnologías                             │
│ Arquitectura                            │
│ Componentes                             │
│ APIs                                    │
│ Funcionalidad                           │
│ Hallazgos                               │
│ Riesgos                                 │
│ Recomendaciones                         │
│ Evidencias                              │
└─────────────────────────────────────────┘




## Decisiones técnicas

### Angular

Se utiliza Angular para construir una interfaz estructurada y mantenible, aprovechando:

- Componentización
- Inyección de dependencias
- Reactive Forms
- HttpClient
- TypeScript

### Separación frontend/backend

El frontend se mantiene desacoplado del motor de análisis.
El frontend es responsable principalmente de:

- Entrada de datos
- Validaciones de interfaz
- Comunicación HTTP
- Estado de la interfaz
- Presentación de resultados

El backend es responsable de:

- Carga de repositorios
- Análisis estático
- Detección de tecnologías
- Componentes
- APIs
- Arquitectura
- Riesgos
- Recomendaciones



## Supuestos

- Los repositorios enviados mediante GitHub son públicos.
- El backend es responsable de validar y procesar el contenido.
- El frontend no ejecuta código proveniente de los repositorios analizados.
- Los resultados dependen de la evidencia disponible en cada repositorio.
- La arquitectura mostrada es una inferencia y debe interpretarse junto con su nivel de confianza.
- El análisis puede presentar falsos positivos o falsos negativos debido a que utiliza reglas heurísticas.



## Limitaciones

El frontend depende de la disponibilidad del backend para ejecutar los análisis.
La calidad de los resultados depende del repositorio analizado y de las convenciones utilizadas por sus desarrolladores.
La aplicación no pretende reemplazar una revisión manual del código.


## Despliegue

El frontend puede desplegarse en plataformas estáticas como:

- Netlify
- Vercel
- GitHub Pages
- Otros servicios compatibles con aplicaciones Angular

Para un despliegue de producción se debe configurar la URL correspondiente del backend.

Ejemplo:

env
VITE_API_URL=https://tu-backend.onrender.com


## Estado del proyecto

Actualmente el frontend cuenta con:

- [x] Interfaz de análisis
- [x] Análisis mediante URL de GitHub
- [x] Carga de archivos ZIP
- [x] Integración con API REST
- [x] Validación de entrada
- [x] Estado de carga
- [x] Manejo de errores
- [x] Visualización de resumen funcional
- [x] Visualización de tecnologías
- [x] Visualización de arquitectura
- [x] Visualización de componentes
- [x] Visualización de APIs
- [x] Visualización de hallazgos
- [x] Visualización de riesgos
- [x] Visualización de recomendaciones
- [x] Visualización de evidencias
- [x] Build de producción



## Proyecto

**Code Insight AI**

Ingeniería inversa automatizada de repositorios para acelerar la comprensión técnica de proyectos existentes.
Desarrollado como parte de una prueba técnica Fullstack / Cloud.






