/**
 * Route Handler para GET /api/v1/ventas/historial/[vehiculoId]
 * Historial de ventas de un vehículo.
 */

import { VentaController } from '@/modules/venta/controllers/venta.controller';

const controller = new VentaController();

export async function GET(_request: Request, { params }: { params: Promise<{ vehiculoId: string }> }) {
  const { vehiculoId } = await params;
  return controller.historialVentas(vehiculoId);
}
