/**
 * Route Handler para /api/v1/vehiculos
 * Servicio de Entidad SOA — expuesto como sustantivo (recurso).
 * Soporta GET (listar) y POST (crear).
 */

import { VehiculoController } from '@/modules/vehiculo/controllers/vehiculo.controller';

const controller = new VehiculoController();

export async function GET() {
  return controller.getAll();
}

export async function POST(request: Request) {
  return controller.create(request);
}
