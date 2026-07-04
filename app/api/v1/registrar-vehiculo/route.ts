/**
 * Route Handler para POST /api/v1/registrar-vehiculo
 * Compositor SOA — Registro e Inspección de Vehículo (Chain).
 */

import { FlujoRegistroController } from '@/modules/registro-vehiculo/controllers/flujo-registro.controller';

const controller = new FlujoRegistroController();

export async function POST(request: Request) {
  return controller.registrar(request);
}
