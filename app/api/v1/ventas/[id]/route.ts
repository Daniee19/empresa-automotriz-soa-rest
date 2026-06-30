/**
 * Route Handler para /api/v1/ventas/[id]
 * Operaciones sobre una venta individual.
 */

import { VentaController } from '@/modules/venta/controllers/venta.controller';

const controller = new VentaController();

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return controller.getById(id);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return controller.update(id, request);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return controller.delete(id);
}
