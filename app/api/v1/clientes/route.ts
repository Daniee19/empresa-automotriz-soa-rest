/**
 * Route Handler para /api/v1/clientes
 * Servicio de Entidad SOA — CRUD de clientes.
 */

import { ClienteController } from '@/modules/cliente/controllers/cliente.controller';

const controller = new ClienteController();

export async function GET() {
  return controller.getAll();
}

export async function POST(request: Request) {
  return controller.create(request);
}
