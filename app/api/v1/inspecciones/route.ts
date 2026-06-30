/**
 * Route Handler para /api/v1/inspecciones
 * Servicio de Entidad SOA — CRUD de inspecciones técnicas.
 */

import { InspeccionController } from '@/modules/inspeccion/controllers/inspeccion.controller';

const controller = new InspeccionController();

export async function GET() {
  return controller.getAll();
}

export async function POST(request: Request) {
  return controller.create(request);
}
