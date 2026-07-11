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

  /** GET /disponibilidad/[vehiculoId] — Verifica si el vehículo está disponible (sin subasta activa) */
  async verificarDisponibilidad(vehiculoId: string): Promise<Response> {
    const resultado = this.service.verificarDisponibilidad(vehiculoId);
    return jsonResponse(successResponse(resultado, 'Disponibilidad verificada'));
  }

  /** POST /registrar-oferta — Registra una oferta en una subasta activa */
  async registrarOferta(request: Request): Promise<Response> {
    const dto = await parseBody<{ subastaId: string; montoOferta: number; clienteId: string }>(request);
    if (!dto.subastaId || !dto.montoOferta || !dto.clienteId) {
      return jsonResponse(
        errorResponse('Faltan campos requeridos: subastaId, montoOferta, clienteId', 'CAMPOS_REQUERIDOS'),
        400
      );
    }
    const resultado = this.service.registrarOferta(dto.subastaId, dto.montoOferta, dto.clienteId);
    if (!resultado.aceptada) {
      return jsonResponse(errorResponse(resultado.motivo || 'Oferta inválida', 'OFERTA_INVALIDA'), 400);
    }
    return jsonResponse(successResponse(resultado, 'Oferta registrada correctamente'));
  }

  /** GET /historial/[vehiculoId] — Historial de subastas de un vehículo */
  async historialOfertas(vehiculoId: string): Promise<Response> {
    const resultado = this.service.consultarHistorialOfertas(vehiculoId);
    return jsonResponse(successResponse(resultado, 'Historial de ofertas obtenido'));
  }
}
