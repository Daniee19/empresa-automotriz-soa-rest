/**
 * InspeccionController — Controlador del Servicio de Entidad "Inspección".
 * CRUD de inspecciones técnicas vehiculares.
 */

import { InspeccionService } from '../services/inspeccion.service';
import { CreateInspeccionDto, UpdateInspeccionDto } from '../dtos/inspeccion.dto';
import { successResponse, errorResponse, jsonResponse, parseBody } from '@/modules/shared/helpers';

export class InspeccionController {
  private service = new InspeccionService();

  /** GET — Lista todas las inspecciones */
  async getAll(): Promise<Response> {
    const inspecciones = this.service.findAll();
    return jsonResponse(successResponse(inspecciones, 'Inspecciones obtenidas correctamente'));
  }

  /** GET /[id] — Obtiene una inspección por ID */
  async getById(id: string): Promise<Response> {
    const inspeccion = this.service.findById(id);
    if (!inspeccion) {
      return jsonResponse(errorResponse('Inspección no encontrada', 'INSPECCION_NOT_FOUND'), 404);
    }
    return jsonResponse(successResponse(inspeccion, 'Inspección obtenida correctamente'));
  }

  /** POST — Registra una nueva inspección */
  async create(request: Request): Promise<Response> {
    const dto = await parseBody<CreateInspeccionDto>(request);
    const inspeccion = this.service.create(dto);
    return jsonResponse(successResponse(inspeccion, 'Inspección registrada correctamente'), 201);
  }

  /** PUT /[id] — Actualiza una inspección existente */
  async update(id: string, request: Request): Promise<Response> {
    const dto = await parseBody<UpdateInspeccionDto>(request);
    const inspeccion = this.service.update(id, dto);
    if (!inspeccion) {
      return jsonResponse(errorResponse('Inspección no encontrada', 'INSPECCION_NOT_FOUND'), 404);
    }
    return jsonResponse(successResponse(inspeccion, 'Inspección actualizada correctamente'));
  }

  /** DELETE /[id] — Elimina una inspección */
  async delete(id: string): Promise<Response> {
    const eliminado = this.service.delete(id);
    if (!eliminado) {
      return jsonResponse(errorResponse('Inspección no encontrada', 'INSPECCION_NOT_FOUND'), 404);
    }
    return jsonResponse(successResponse(null, 'Inspección eliminada correctamente'));
  }
}
