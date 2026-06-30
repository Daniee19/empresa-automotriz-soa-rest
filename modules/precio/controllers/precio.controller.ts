/**
 * PrecioController — Controlador del Servicio de Tarea "Calcular Precio".
 * Recibe los datos del vehículo y devuelve el precio referencial calculado.
 */

import { PrecioService, CalculoPrecioDto } from '../services/precio.service';
import { successResponse, errorResponse, jsonResponse, parseBody } from '@/modules/shared/helpers';

export class PrecioController {
  private service = new PrecioService();

  /** POST /api/v1/calcular-precio — Calcula el precio referencial de un vehículo */
  async calcular(request: Request): Promise<Response> {
    const dto = await parseBody<CalculoPrecioDto>(request);

    // Validación mínima de campos requeridos
    if (!dto.vehiculoId || !dto.precioBase || !dto.anio || !dto.marca) {
      return jsonResponse(
        errorResponse('Faltan campos requeridos: vehiculoId, precioBase, anio, marca', 'CAMPOS_REQUERIDOS'),
        400
      );
    }

    const resultado = this.service.calcularPrecio(dto);
    return jsonResponse(successResponse(resultado, 'Precio calculado correctamente'));
  }
}
