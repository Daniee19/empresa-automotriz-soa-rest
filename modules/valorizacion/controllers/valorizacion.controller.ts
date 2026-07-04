/**
 * ValorizacionController — Controlador del Compositor "Valorización Vehicular".
 * Patrón Scatter-Gather — lanza consultas paralelas y agrega resultados.
 */

import { ValorizacionService, ValorizacionDto } from '../services/valorizacion.service';
import { successResponse, errorResponse, jsonResponse, parseBody } from '@/modules/shared/helpers';

export class ValorizacionController {
  private service = new ValorizacionService();

  /** POST /api/v1/valorizar-vehiculo */
  async valorizar(request: Request): Promise<Response> {
    let dto: ValorizacionDto;
    try {
      dto = await parseBody<ValorizacionDto>(request);
    } catch {
      return jsonResponse(errorResponse('El body debe ser JSON válido', 'JSON_INVALIDO'), 400);
    }

    if (!dto.vehiculoId) {
      return jsonResponse(
        errorResponse('Se requiere el campo vehiculoId', 'CAMPOS_REQUERIDOS'),
        400
      );
    }

    const resultado = await this.service.valorizar(dto);
    return jsonResponse(successResponse(resultado, 'Valorización completada'), 200);
  }
}
