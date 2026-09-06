/**
 * Configuración de entorno para producción (`ng build --configuration production`).
 * Reemplaza a environment.ts vía fileReplacements en angular.json.
 *
 * Ajusta `apiUrl` a la URL pública real del backend desplegado antes de
 * publicar el build (por ejemplo la URL de tu servicio en Render/Fly/EC2/etc).
 */
export const environment = {
  production: true,
  apiUrl: 'https://TU-BACKEND-DESPLEGADO.example.com',
};
