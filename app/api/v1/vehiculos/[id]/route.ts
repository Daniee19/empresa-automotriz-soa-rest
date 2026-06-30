/**
 * Route Handler para /api/v1/vehiculos/[id]
 * Operaciones sobre un vehículo individual: consultar, actualizar, eliminar.
 */

import { VehiculoController } from '@/modules/vehiculo/controllers/vehiculo.controller';

const controller = new VehiculoController();

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
