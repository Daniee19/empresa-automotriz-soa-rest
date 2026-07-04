/**
 * Route Handler para POST /api/v1/valorizar-vehiculo
 * Compositor SOA — Valorización Vehicular Inteligente (Scatter-Gather).
 */

import { ValorizacionController } from '@/modules/valorizacion/controllers/valorizacion.controller';

const controller = new ValorizacionController();

export async function POST(request: Request) {
  return controller.valorizar(request);
}
