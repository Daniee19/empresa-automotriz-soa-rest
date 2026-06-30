/**
 * Route Handler para /api/v1/inspecciones/[id]
 * Operaciones sobre una inspección individual.
 */

import { InspeccionController } from '@/modules/inspeccion/controllers/inspeccion.controller';

const controller = new InspeccionController();

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
