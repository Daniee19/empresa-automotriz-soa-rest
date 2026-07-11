/**
 * Route Handler para GET /api/v1/subastas/historial/[vehiculoId]
 * Historial de subastas/ofertas de un vehículo.
 */

import { SubastaController } from '@/modules/subasta/controllers/subasta.controller';

const controller = new SubastaController();

export async function GET(_request: Request, { params }: { params: Promise<{ vehiculoId: string }> }) {
  const { vehiculoId } = await params;
  return controller.historialOfertas(vehiculoId);
}
