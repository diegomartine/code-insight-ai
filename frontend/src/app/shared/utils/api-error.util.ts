import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse } from '../../core/models/analysis.model';

/**
 * Traduce un error HTTP del backend a un mensaje seguro para mostrar al
 * usuario. Nunca devuelve stack traces; si el backend envía un `message`
 * de dominio (los que arma AnalysisController/loaders), se muestra tal
 * cual porque ya está pensado para el usuario final.
 */
export function toFriendlyErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No fue posible conectarse con el servidor de análisis. Verifica que el backend esté disponible.';
    }

    const body = error.error as ApiErrorResponse | undefined;
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join(' ') : body.message;
    }

    switch (error.status) {
      case 404:
        return 'No se encontró el repositorio.';
      case 403:
        return 'No fue posible acceder al repositorio (¿es privado?).';
      case 413:
        return 'El archivo es demasiado grande.';
      case 429:
        return 'Se alcanzó el límite de solicitudes. Intenta nuevamente en unos minutos.';
      case 504:
        return 'El servidor tardó demasiado en responder. Intenta nuevamente.';
      default:
        return 'No fue posible analizar el repositorio.';
    }
  }

  return 'No fue posible analizar el repositorio.';
}
