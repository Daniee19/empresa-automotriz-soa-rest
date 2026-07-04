/**
 * FlujoRegistroController — Controlador del Compositor "Registro e Inspección".
 * Patrón Chain — secuencial con detención si falla la inspección.
 */

import { FlujoRegistroService, RegistroVehiculoDto } from '../services/flujo-registro.service';
import { successResponse, errorResponse, jsonResponse, parseBody } from '@/modules/shared/helpers';

export class FlujoRegistroController {
  private service = new FlujoRegistroService();

  /** POST /api/v1/registrar-vehiculo */
  async registrar(request: Request): Promise<Response> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse(
        errorResponse('Se requiere header Authorization con formato Bearer <token>', 'AUTH_REQUERIDA'),
        401
      );
    }
    const token = authHeader.replace('Bearer ', '');

    let dto: RegistroVehiculoDto;
    try {
      dto = await parseBody<RegistroVehiculoDto>(request);
    } catch {
      return jsonResponse(errorResponse('El body debe ser JSON válido', 'JSON_INVALIDO'), 400);
    }

    if (!dto.marca || !dto.modelo || !dto.anio || !dto.placa || !dto.vin || !dto.resultadoInspeccion || !dto.inspector || !dto.correoNotificacion) {
      return jsonResponse(
        errorResponse('Faltan campos requeridos: marca, modelo, anio, placa, vin, resultadoInspeccion, inspector, correoNotificacion', 'CAMPOS_REQUERIDOS'),
        400
      );
    }

    const resultado = await this.service.registrar(dto, token);

    if (!resultado.exito) {
      if (resultado.errorCode === 'TOKEN_INVALIDO') {
        return jsonResponse(errorResponse(resultado.error, resultado.errorCode), 401);
      }
      // Inspección no aprobada — retorna resultado parcial con 422
      return jsonResponse({
        success: false,
        message: resultado.error,
        errorCode: resultado.errorCode,
        data: resultado.resultadoParcial,
      }, 422);
    }

    return jsonResponse(successResponse(resultado.resultado, 'Vehículo registrado e inspeccionado exitosamente'), 201);
  }
}
