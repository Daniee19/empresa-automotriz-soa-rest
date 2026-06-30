/**
 * ServicioNotificacion — Servicio de Utilidad SOA.
 * Simula el envío de notificaciones (no envía correos reales).
 * Se expone como verbo: POST /api/v1/enviar-notificacion
 */

/** Datos necesarios para enviar una notificación */
export interface NotificacionDto {
  destinatario: string; // Email o identificador del receptor
  asunto: string;
  mensaje: string;
  tipo: 'email' | 'sms' | 'push';
}

/** Resultado de la simulación del envío */
export interface NotificacionResultadoDto {
  id: string;
  destinatario: string;
  asunto: string;
  tipo: string;
  estado: 'enviado';     // Siempre "enviado" porque es simulado
  fechaEnvio: string;
}

export class NotificacionService {
  /** Registro de notificaciones enviadas (para consulta/auditoría) */
  private static historial: NotificacionResultadoDto[] = [];
  private static nextId = 1;

  /**
   * Simula el envío de una notificación.
   * En un entorno real aquí se conectaría con un servicio de email/SMS.
   */
  enviarNotificacion(dto: NotificacionDto): NotificacionResultadoDto {
    const resultado: NotificacionResultadoDto = {
      id: `NT-${String(NotificacionService.nextId++).padStart(3, '0')}`,
      destinatario: dto.destinatario,
      asunto: dto.asunto,
      tipo: dto.tipo,
      estado: 'enviado',
      fechaEnvio: new Date().toISOString(),
    };

    // Se guarda en historial para trazabilidad
    NotificacionService.historial.push(resultado);

    console.log(`[NOTIFICACIÓN SIMULADA] ${dto.tipo} → ${dto.destinatario}: ${dto.asunto}`);
    return resultado;
  }
}
