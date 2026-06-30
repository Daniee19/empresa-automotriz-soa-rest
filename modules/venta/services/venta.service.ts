/**
 * ServicioVenta — Servicio de Entidad SOA.
 * CRUD de ventas. NO contiene lógica de orquestación.
 * La orquestación se realiza en el servicio de tarea "procesar-venta".
 */

import { VentaRepository } from '../repositories/venta.repository';
import { CreateVentaDto, UpdateVentaDto, VentaResponseDto } from '../dtos/venta.dto';
import { Venta } from '../models/venta.model';

export class VentaService {
  private repository = new VentaRepository();

  /** Convierte modelo de dominio a DTO de respuesta */
  private toResponseDto(venta: Venta): VentaResponseDto {
    return {
      id: venta.id,
      clienteId: venta.clienteId,
      vehiculoId: venta.vehiculoId,
      fecha: venta.fecha,
      precioFinal: venta.precioFinal,
      estado: venta.estado,
    };
  }

  findAll(): VentaResponseDto[] {
    return this.repository.findAll().map(this.toResponseDto);
  }

  findById(id: string): VentaResponseDto | undefined {
    const venta = this.repository.findById(id);
    return venta ? this.toResponseDto(venta) : undefined;
  }

  /** Registra una venta directamente (usado por la orquestación) */
  create(dto: CreateVentaDto): VentaResponseDto {
    const venta = this.repository.create(dto);
    return this.toResponseDto(venta);
  }

  update(id: string, dto: UpdateVentaDto): VentaResponseDto | undefined {
    const venta = this.repository.update(id, dto);
    return venta ? this.toResponseDto(venta) : undefined;
  }

  delete(id: string): boolean {
    return this.repository.delete(id);
  }
}
