/**
 * NotificacionController — Controlador del Servicio de Utilidad "Notificación".
 * Simula el envío de notificaciones por email, SMS o push.
 */

import { NotificacionService, NotificacionDto } from '../services/notificacion.service';
import { successResponse, errorResponse, jsonResponse, parseBody } from '@/modules/shared/helpers';

export class NotificacionController {
  private service = new NotificacionService();

  /** POST /api/v1/enviar-notificacion — Simula el envío de una notificación */
  async enviar(request: Request): Promise<Response> {
    let dto: NotificacionDto;
    try {
      dto = await parseBody<NotificacionDto>(request);
    } catch {
      return jsonResponse(
        errorResponse('El body debe ser JSON válido', 'JSON_INVALIDO'),
        400
      );
    }

    if (!dto.destinatario || !dto.asunto || !dto.mensaje || !dto.tipo) {
      return jsonResponse(
        errorResponse('Faltan campos requeridos: destinatario, asunto, mensaje, tipo', 'CAMPOS_REQUERIDOS'),
        400
      );
    }

    const resultado = this.service.enviarNotificacion(dto);
    return jsonResponse(successResponse(resultado, 'Notificación enviada correctamente'), 201);
  }
}
