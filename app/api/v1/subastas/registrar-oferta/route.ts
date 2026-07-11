/**
 * Route Handler para POST /api/v1/subastas/registrar-oferta
 * Registra una oferta en una subasta activa.
 */

import { SubastaController } from '@/modules/subasta/controllers/subasta.controller';

const controller = new SubastaController();

export async function POST(request: Request) {
  return controller.registrarOferta(request);
}
