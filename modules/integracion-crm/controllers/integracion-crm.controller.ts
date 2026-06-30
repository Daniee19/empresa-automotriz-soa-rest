/**
 * IntegracionCRMController — Controlador del Servicio de Utilidad "Integración CRM".
 * Simula la sincronización de datos con un sistema CRM externo.
 */

import { IntegracionCRMService, SincronizacionCRMDto } from '../services/integracion-crm.service';
import { successResponse, errorResponse, jsonResponse, parseBody } from '@/modules/shared/helpers';

export class IntegracionCRMController {
  private service = new IntegracionCRMService();

  /** POST /api/v1/sincronizar-crm — Simula sincronización con CRM externo */
  async sincronizar(request: Request): Promise<Response> {
    const dto = await parseBody<SincronizacionCRMDto>(request);

    if (!dto.entidad || !dto.accion || !dto.datos) {
      return jsonResponse(
        errorResponse('Faltan campos requeridos: entidad, accion, datos', 'CAMPOS_REQUERIDOS'),
        400
      );
    }

    const resultado = this.service.sincronizar(dto);
    return jsonResponse(successResponse(resultado, 'Sincronización con CRM exitosa'));
  }
}
