/**
 * Route Handler para POST /api/v1/sincronizar-crm
 * Servicio de Utilidad SOA — simulación de sincronización con CRM externo.
 */

import { IntegracionCRMController } from '@/modules/integracion-crm/controllers/integracion-crm.controller';

const controller = new IntegracionCRMController();

export async function POST(request: Request) {
  return controller.sincronizar(request);
}
