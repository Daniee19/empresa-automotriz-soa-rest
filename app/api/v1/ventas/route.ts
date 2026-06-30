/**
 * Route Handler para /api/v1/ventas
 * Servicio de Entidad SOA — CRUD de ventas (sin orquestación).
 */

import { VentaController } from '@/modules/venta/controllers/venta.controller';

const controller = new VentaController();

export async function GET() {
  return controller.getAll();
}

export async function POST(request: Request) {
  return controller.create(request);
}
