/**
 * ClienteController — Controlador del Servicio de Entidad "Cliente".
 * Traduce peticiones HTTP a operaciones del servicio de clientes.
 */

import { ClienteService } from '../services/cliente.service';
import { CreateClienteDto, UpdateClienteDto } from '../dtos/cliente.dto';
import { successResponse, errorResponse, jsonResponse, parseBody } from '@/modules/shared/helpers';

export class ClienteController {
  private service = new ClienteService();

  /** GET — Lista todos los clientes */
  async getAll(): Promise<Response> {
    const clientes = this.service.findAll();
    return jsonResponse(successResponse(clientes, 'Clientes obtenidos correctamente'));
  }

  /** GET /[id] — Obtiene un cliente por ID */
  async getById(id: string): Promise<Response> {
    const cliente = this.service.findById(id);
    if (!cliente) {
      return jsonResponse(errorResponse('Cliente no encontrado', 'CLIENTE_NOT_FOUND'), 404);
    }
    return jsonResponse(successResponse(cliente, 'Cliente obtenido correctamente'));
  }

  /** POST — Registra un nuevo cliente */
  async create(request: Request): Promise<Response> {
    const dto = await parseBody<CreateClienteDto>(request);
    const cliente = this.service.create(dto);
    return jsonResponse(successResponse(cliente, 'Cliente registrado correctamente'), 201);
  }

  /** PUT /[id] — Actualiza un cliente existente */
  async update(id: string, request: Request): Promise<Response> {
    const dto = await parseBody<UpdateClienteDto>(request);
    const cliente = this.service.update(id, dto);
    if (!cliente) {
      return jsonResponse(errorResponse('Cliente no encontrado', 'CLIENTE_NOT_FOUND'), 404);
    }
    return jsonResponse(successResponse(cliente, 'Cliente actualizado correctamente'));
  }

  /** DELETE /[id] — Elimina un cliente */
  async delete(id: string): Promise<Response> {
    const eliminado = this.service.delete(id);
    if (!eliminado) {
      return jsonResponse(errorResponse('Cliente no encontrado', 'CLIENTE_NOT_FOUND'), 404);
    }
    return jsonResponse(successResponse(null, 'Cliente eliminado correctamente'));
  }
}
