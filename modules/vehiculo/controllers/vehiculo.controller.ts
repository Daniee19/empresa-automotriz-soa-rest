/**
 * VehiculoController — Controlador del Servicio de Entidad "Vehículo".
 * Recibe las peticiones HTTP, delega al servicio y devuelve respuestas estandarizadas.
 * Nunca contiene lógica de negocio; solo traduce HTTP ↔ servicio.
 */

import { VehiculoService } from '../services/vehiculo.service';
import { CreateVehiculoDto, UpdateVehiculoDto } from '../dtos/vehiculo.dto';
import { successResponse, errorResponse, jsonResponse, parseBody } from '@/modules/shared/helpers';

export class VehiculoController {
  private service = new VehiculoService();

  /** GET /api/v1/vehiculos — Lista todos los vehículos */
  async getAll(): Promise<Response> {
    const vehiculos = this.service.findAll();
    return jsonResponse(successResponse(vehiculos, 'Vehículos obtenidos correctamente'));
  }

  /** GET /api/v1/vehiculos/[id] — Obtiene un vehículo por ID */
  async getById(id: string): Promise<Response> {
    const vehiculo = this.service.findById(id);
    if (!vehiculo) {
      return jsonResponse(errorResponse('Vehículo no encontrado', 'VEHICULO_NOT_FOUND'), 404);
    }
    return jsonResponse(successResponse(vehiculo, 'Vehículo obtenido correctamente'));
  }

  /** POST /api/v1/vehiculos — Registra un nuevo vehículo */
  async create(request: Request): Promise<Response> {
    const dto = await parseBody<CreateVehiculoDto>(request);
    const vehiculo = this.service.create(dto);
    return jsonResponse(successResponse(vehiculo, 'Vehículo registrado correctamente'), 201);
  }

  /** PUT /api/v1/vehiculos/[id] — Actualiza un vehículo existente */
  async update(id: string, request: Request): Promise<Response> {
    const dto = await parseBody<UpdateVehiculoDto>(request);
    const vehiculo = this.service.update(id, dto);
    if (!vehiculo) {
      return jsonResponse(errorResponse('Vehículo no encontrado', 'VEHICULO_NOT_FOUND'), 404);
    }
    return jsonResponse(successResponse(vehiculo, 'Vehículo actualizado correctamente'));
  }

  /** DELETE /api/v1/vehiculos/[id] — Elimina un vehículo */
  async delete(id: string): Promise<Response> {
    const eliminado = this.service.delete(id);
    if (!eliminado) {
      return jsonResponse(errorResponse('Vehículo no encontrado', 'VEHICULO_NOT_FOUND'), 404);
    }
    return jsonResponse(successResponse(null, 'Vehículo eliminado correctamente'));
  }
}
