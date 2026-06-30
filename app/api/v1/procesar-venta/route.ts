/**
 * Route Handler para POST /api/v1/procesar-venta
 * Servicio de Tarea SOA — ORQUESTADOR principal del sistema.
 *
 * Este endpoint coordina el flujo completo de venta llamando secuencialmente a:
 * autenticación → cliente → vehículo → inspección → subasta → venta → notificación → CRM
 *
 * Es el ÚNICO punto del sistema donde los servicios se coordinan entre sí.
 */

import { ProcesarVentaController } from '@/modules/venta/controllers/procesar-venta.controller';

const controller = new ProcesarVentaController();

export async function POST(request: Request) {
  return controller.procesar(request);
}
