/**
 * Route Handler para GET /api/v1/crm/interacciones/[clienteId]
 * Obtiene interacciones de un cliente desde el CRM.
 */

import { IntegracionCRMController } from '@/modules/integracion-crm/controllers/integracion-crm.controller';

const controller = new IntegracionCRMController();

export async function GET(_request: Request, { params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = await params;
  return controller.obtenerInteracciones(clienteId);
}
