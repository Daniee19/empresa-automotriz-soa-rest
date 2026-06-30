/**
 * ServicioCliente — Servicio de Entidad SOA.
 * CRUD completo para la gestión de clientes.
 */

import { ClienteRepository } from '../repositories/cliente.repository';
import { CreateClienteDto, UpdateClienteDto, ClienteResponseDto } from '../dtos/cliente.dto';
import { Cliente } from '../models/cliente.model';

export class ClienteService {
  private repository = new ClienteRepository();

  /** Convierte modelo de dominio a DTO de respuesta */
  private toResponseDto(cliente: Cliente): ClienteResponseDto {
    return {
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      email: cliente.email,
      telefono: cliente.telefono,
      documento: cliente.documento,
    };
  }

  findAll(): ClienteResponseDto[] {
    return this.repository.findAll().map(this.toResponseDto);
  }

  findById(id: string): ClienteResponseDto | undefined {
    const cliente = this.repository.findById(id);
    return cliente ? this.toResponseDto(cliente) : undefined;
  }

  create(dto: CreateClienteDto): ClienteResponseDto {
    const cliente = this.repository.create(dto);
    return this.toResponseDto(cliente);
  }

  update(id: string, dto: UpdateClienteDto): ClienteResponseDto | undefined {
    const cliente = this.repository.update(id, dto);
    return cliente ? this.toResponseDto(cliente) : undefined;
  }

  delete(id: string): boolean {
    return this.repository.delete(id);
  }
}
