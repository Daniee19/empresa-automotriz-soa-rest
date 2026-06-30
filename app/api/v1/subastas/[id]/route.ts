/**
 * Route Handler para /api/v1/subastas/[id]
 * Operaciones sobre una subasta individual.
 */

import { SubastaController } from '@/modules/subasta/controllers/subasta.controller';

const controller = new SubastaController();

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
