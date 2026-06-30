/**
 * SubastaController — Controlador del Servicio de Entidad "Subasta".
 * CRUD de subastas de vehículos.
 */

import { SubastaService } from '../services/subasta.service';
import { CreateSubastaDto, UpdateSubastaDto } from '../dtos/subasta.dto';
import { successResponse, errorResponse, jsonResponse, parseBody } from '@/modules/shared/helpers';

export class SubastaController {
  private service = new SubastaService();

  /** GET — Lista todas las subastas */
  async getAll(): Promise<Response> {
    const subastas = this.service.findAll();
    return jsonResponse(successResponse(subastas, 'Subastas obtenidas correctamente'));
  }

  /** GET /[id] — Obtiene una subasta por ID */
  async getById(id: string): Promise<Response> {
    const subasta = this.service.findById(id);
    if (!subasta) {
      return jsonResponse(errorResponse('Subasta no encontrada', 'SUBASTA_NOT_FOUND'), 404);
    }
    return jsonResponse(successResponse(subasta, 'Subasta obtenida correctamente'));
  }

  /** POST — Crea una nueva subasta */
  async create(request: Request): Promise<Response> {
    const dto = await parseBody<CreateSubastaDto>(request);
    const subasta = this.service.create(dto);
    return jsonResponse(successResponse(subasta, 'Subasta creada correctamente'), 201);
  }

  /** PUT /[id] — Actualiza una subasta existente */
  async update(id: string, request: Request): Promise<Response> {
    const dto = await parseBody<UpdateSubastaDto>(request);
    const subasta = this.service.update(id, dto);
    if (!subasta) {
      return jsonResponse(errorResponse('Subasta no encontrada', 'SUBASTA_NOT_FOUND'), 404);
    }
    return jsonResponse(successResponse(subasta, 'Subasta actualizada correctamente'));
  }

  /** DELETE /[id] — Elimina una subasta */
  async delete(id: string): Promise<Response> {
    const eliminado = this.service.delete(id);
    if (!eliminado) {
      return jsonResponse(errorResponse('Subasta no encontrada', 'SUBASTA_NOT_FOUND'), 404);
    }
    return jsonResponse(successResponse(null, 'Subasta eliminada correctamente'));
  }
}
