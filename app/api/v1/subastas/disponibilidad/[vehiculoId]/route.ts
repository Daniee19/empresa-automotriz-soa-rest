/**
 * Route Handler para GET /api/v1/subastas/disponibilidad/[vehiculoId]
 * Verifica si un vehículo está disponible (sin subasta activa).
 */

import { SubastaController } from '@/modules/subasta/controllers/subasta.controller';

const controller = new SubastaController();

export async function GET(_request: Request, { params }: { params: Promise<{ vehiculoId: string }> }) {
  const { vehiculoId } = await params;
  return controller.verificarDisponibilidad(vehiculoId);
}
