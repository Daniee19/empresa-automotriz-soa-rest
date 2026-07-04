/**
 * ProcesarVentaController — Controlador del Compositor "Procesar Venta".
 * Patrón Chain — extrae el token y delega al servicio orquestador.
 */

import { ProcesarVentaService, ProcesarVentaDto } from '../services/procesar-venta.service';
import { successResponse, errorResponse, jsonResponse, parseBody } from '@/modules/shared/helpers';

export class ProcesarVentaController {
  private service = new ProcesarVentaService();

  /** POST /api/v1/procesar-venta — Ejecuta el flujo completo de venta */
  async procesar(request: Request): Promise<Response> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse(
        errorResponse('Se requiere header Authorization con formato Bearer <token>', 'AUTH_REQUERIDA'),
        401
      );
    }
    const token = authHeader.replace('Bearer ', '');

    let dto: ProcesarVentaDto;
    try {
      dto = await parseBody<ProcesarVentaDto>(request);
    } catch {
      return jsonResponse(errorResponse('El body debe ser JSON válido', 'JSON_INVALIDO'), 400);
    }

    if (!dto.clienteId || !dto.vehiculoId || !dto.precioOfertado) {
      return jsonResponse(
        errorResponse('Faltan campos requeridos: clienteId, vehiculoId, precioOfertado', 'CAMPOS_REQUERIDOS'),
        400
      );
    }

    const resultado = await this.service.procesar(dto, token);

    if (!resultado.exito) {
      const status = resultado.errorCode === 'TOKEN_INVALIDO' ? 401 : 400;
      return jsonResponse(errorResponse(resultado.error, resultado.errorCode), status);
    }

    return jsonResponse(successResponse(resultado.resultado, 'Venta procesada exitosamente'), 201);
  }
}
