/**
 * Configuración de entorno para desarrollo local (`ng serve`).
 * Toda la app lee la URL del backend SOLO de aquí — ningún componente
 * ni servicio debe hardcodear "http://localhost:3000" en otro lugar.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
};
