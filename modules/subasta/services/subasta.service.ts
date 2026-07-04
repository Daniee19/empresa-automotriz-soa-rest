/**
 * ServicioSubasta — Servicio de Entidad SOA.
 * CRUD de subastas. Incluye verificación de disponibilidad para la orquestación.
 */

import { SubastaRepository } from '../repositories/subasta.repository';
import { CreateSubastaDto, UpdateSubastaDto, SubastaResponseDto } from '../dtos/subasta.dto';
import { Subasta } from '../models/subasta.model';

export class SubastaService {
  private repository = new SubastaRepository();

  /** Convierte modelo de dominio a DTO de respuesta */
  private toResponseDto(subasta: Subasta): SubastaResponseDto {
    return {
      id: subasta.id,
      vehiculoId: subasta.vehiculoId,
      fechaInicio: subasta.fechaInicio,
      fechaFin: subasta.fechaFin,
      precioBase: subasta.precioBase,
      precioActual: subasta.precioActual,
      estado: subasta.estado,
      ganadorId: subasta.ganadorId,
    };
  }

  findAll(): SubastaResponseDto[] {
    return this.repository.findAll().map(this.toResponseDto);
  }

  findById(id: string): SubastaResponseDto | undefined {
    const subasta = this.repository.findById(id);
    return subasta ? this.toResponseDto(subasta) : undefined;
  }

  /** Verifica si el vehículo NO tiene una subasta activa (disponible para venta directa) */
  verificarDisponibilidad(vehiculoId: string): { disponible: boolean; subasta?: SubastaResponseDto } {
    const subasta = this.repository.findActiveByVehiculoId(vehiculoId);
    if (subasta) {
      return { disponible: false, subasta: this.toResponseDto(subasta) };
    }
    return { disponible: true };
  }

  /** Registra una oferta en una subasta activa. Retorna la subasta o null si no existe */
  registrarOferta(idSubasta: string, montoOferta: number, clienteId: string): { aceptada: boolean; subasta?: SubastaResponseDto; motivo?: string } {
    const subasta = this.repository.findById(idSubasta);
    if (!subasta) return { aceptada: false, motivo: 'Subasta no encontrada' };
    if (subasta.estado !== 'activa') return { aceptada: false, motivo: 'La subasta no está activa' };
    if (montoOferta <= subasta.precioActual) {
      return { aceptada: false, motivo: `La oferta debe ser mayor a la oferta actual ($${subasta.precioActual})` };
    }
    // Oferta válida — actualizar
    const actualizada = this.repository.update(idSubasta, { precioActual: montoOferta, ganadorId: clienteId });
    return { aceptada: true, subasta: actualizada ? this.toResponseDto(actualizada) : undefined };
  }

  /** Consulta el historial de ofertas/subastas de un vehículo */
  consultarHistorialOfertas(vehiculoId: string): SubastaResponseDto[] {
    return this.repository.findAll()
      .filter((s) => s.vehiculoId === vehiculoId)
      .map(this.toResponseDto);
  }

  create(dto: CreateSubastaDto): SubastaResponseDto {
    const subasta = this.repository.create(dto);
    return this.toResponseDto(subasta);
  }

  update(id: string, dto: UpdateSubastaDto): SubastaResponseDto | undefined {
    const subasta = this.repository.update(id, dto);
    return subasta ? this.toResponseDto(subasta) : undefined;
  }

  delete(id: string): boolean {
    return this.repository.delete(id);
  }
}
