/**
 * Route Handler para POST /api/v1/procesar-oferta
 * Compositor SOA — Proceso de Subasta (Router condicional + Chain).
 */

import { FlujoSubastaController } from '@/modules/subasta-flujo/controllers/flujo-subasta.controller';

const controller = new FlujoSubastaController();

export async function POST(request: Request) {
  return controller.procesarOferta(request);
}
