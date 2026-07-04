/**
 * FlujoSubastaController — Controlador del Compositor "Proceso de Subasta".
 * Patrón Router condicional + Chain.
 */

import { FlujoSubastaService, ProcesarOfertaDto } from '../services/flujo-subasta.service';
import { successResponse, errorResponse, jsonResponse, parseBody } from '@/modules/shared/helpers';

export class FlujoSubastaController {
  private service = new FlujoSubastaService();

  /** POST /api/v1/procesar-oferta */
  async procesarOferta(request: Request): Promise<Response> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse(
        errorResponse('Se requiere header Authorization con formato Bearer <token>', 'AUTH_REQUERIDA'),
        401
      );
    }
    const token = authHeader.replace('Bearer ', '');

    let dto: ProcesarOfertaDto;
    try {
      dto = await parseBody<ProcesarOfertaDto>(request);
    } catch {
      return jsonResponse(errorResponse('El body debe ser JSON válido', 'JSON_INVALIDO'), 400);
    }

    if (!dto.subastaId || !dto.clienteId || !dto.montoOferta) {
      return jsonResponse(
        errorResponse('Faltan campos requeridos: subastaId, clienteId, montoOferta', 'CAMPOS_REQUERIDOS'),
        400
      );
    }

    const resultado = await this.service.procesarOferta(dto, token);

    if (!resultado.exito) {
      const status = resultado.errorCode === 'TOKEN_INVALIDO' ? 401 : 400;
      return jsonResponse(errorResponse(resultado.error, resultado.errorCode), status);
    }

    return jsonResponse(successResponse(resultado.resultado, 'Oferta procesada exitosamente'), 200);
  }
}
