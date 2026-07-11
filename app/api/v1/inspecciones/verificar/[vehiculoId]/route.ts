/**
 * Route Handler para GET /api/v1/inspecciones/verificar/[vehiculoId]
 * Verifica si un vehículo tiene inspección aprobada.
 */

import { InspeccionController } from '@/modules/inspeccion/controllers/inspeccion.controller';

const controller = new InspeccionController();

export async function GET(_request: Request, { params }: { params: Promise<{ vehiculoId: string }> }) {
  const { vehiculoId } = await params;
  return controller.verificarInspeccion(vehiculoId);
}
