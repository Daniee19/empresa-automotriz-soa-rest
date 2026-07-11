/**
 * Route Handler para GET /api/v1/inspecciones/estado/[vehiculoId]
 * Valida el estado técnico de un vehículo.
 */

import { InspeccionController } from '@/modules/inspeccion/controllers/inspeccion.controller';

const controller = new InspeccionController();

export async function GET(_request: Request, { params }: { params: Promise<{ vehiculoId: string }> }) {
  const { vehiculoId } = await params;
  return controller.validarEstadoVehiculo(vehiculoId);
}
