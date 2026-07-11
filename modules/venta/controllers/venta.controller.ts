/**
 * VentaController — Controlador del Servicio de Entidad "Venta".
 * CRUD puro, sin lógica de orquestación.
 */

import { VentaService } from '../services/venta.service';
import { CreateVentaDto, UpdateVentaDto } from '../dtos/venta.dto';
import { successResponse, errorResponse, jsonResponse, parseBody } from '@/modules/shared/helpers';

export class VentaController {
  private service = new VentaService();

  /** GET — Lista todas las ventas */
  async getAll(): Promise<Response> {
    const ventas = this.service.findAll();
    return jsonResponse(successResponse(ventas, 'Ventas obtenidas correctamente'));
  }

  /** GET /[id] — Obtiene una venta por ID */
  async getById(id: string): Promise<Response> {
    const venta = this.service.findById(id);
    if (!venta) {
      return jsonResponse(errorResponse('Venta no encontrada', 'VENTA_NOT_FOUND'), 404);
    }
    return jsonResponse(successResponse(venta, 'Venta obtenida correctamente'));
  }

  /** POST — Registra una venta directamente */
  async create(request: Request): Promise<Response> {
    const dto = await parseBody<CreateVentaDto>(request);
    const venta = this.service.create(dto);
    return jsonResponse(successResponse(venta, 'Venta registrada correctamente'), 201);
  }

  /** PUT /[id] — Actualiza una venta existente */
  async update(id: string, request: Request): Promise<Response> {
    const dto = await parseBody<UpdateVentaDto>(request);
    const venta = this.service.update(id, dto);
    if (!venta) {
      return jsonResponse(errorResponse('Venta no encontrada', 'VENTA_NOT_FOUND'), 404);
    }
    return jsonResponse(successResponse(venta, 'Venta actualizada correctamente'));
  }

  /** DELETE /[id] — Elimina una venta */
  async delete(id: string): Promise<Response> {
    const eliminado = this.service.delete(id);
    if (!eliminado) {
      return jsonResponse(errorResponse('Venta no encontrada', 'VENTA_NOT_FOUND'), 404);
    }
    return jsonResponse(successResponse(null, 'Venta eliminada correctamente'));
  }

  /** GET /historial/[vehiculoId] — Historial de ventas de un vehículo */
  async historialVentas(vehiculoId: string): Promise<Response> {
    const resultado = this.service.consultarHistorialVentas(vehiculoId);
    return jsonResponse(successResponse(resultado, 'Historial de ventas obtenido'));
  }
}
