/**
 * Route Handler para /api/v1/clientes/[id]
 * Operaciones sobre un cliente individual.
 */

import { ClienteController } from '@/modules/cliente/controllers/cliente.controller';

const controller = new ClienteController();

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
