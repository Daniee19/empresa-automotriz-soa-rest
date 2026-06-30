/**
 * Route Handler para POST /api/v1/enviar-notificacion
 * Servicio de Utilidad SOA — simulación de envío de notificaciones.
 */

import { NotificacionController } from '@/modules/notificacion/controllers/notificacion.controller';

const controller = new NotificacionController();

export async function POST(request: Request) {
  return controller.enviar(request);
}
