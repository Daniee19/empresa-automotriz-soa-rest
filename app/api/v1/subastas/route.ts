/**
 * Route Handler para /api/v1/subastas
 * Servicio de Entidad SOA — CRUD de subastas.
 */

import { SubastaController } from '@/modules/subasta/controllers/subasta.controller';

const controller = new SubastaController();

export async function GET() {
  return controller.getAll();
}

export async function POST(request: Request) {
  return controller.create(request);
}
