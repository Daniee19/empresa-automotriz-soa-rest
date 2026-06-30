/**
 * ServicioInspeccion — Servicio de Entidad SOA.
 * CRUD de inspecciones técnicas vehiculares.
 * Incluye verificación de inspección aprobada (usada por la orquestación).
 */

import { InspeccionRepository } from '../repositories/inspeccion.repository';
import { CreateInspeccionDto, UpdateInspeccionDto, InspeccionResponseDto } from '../dtos/inspeccion.dto';
import { Inspeccion } from '../models/inspeccion.model';

export class InspeccionService {
  private repository = new InspeccionRepository();

  /** Convierte modelo de dominio a DTO de respuesta */
  private toResponseDto(inspeccion: Inspeccion): InspeccionResponseDto {
    return {
      id: inspeccion.id,
      vehiculoId: inspeccion.vehiculoId,
      fecha: inspeccion.fecha,
      resultado: inspeccion.resultado,
      observaciones: inspeccion.observaciones,
      inspector: inspeccion.inspector,
    };
  }

  findAll(): InspeccionResponseDto[] {
    return this.repository.findAll().map(this.toResponseDto);
  }

  findById(id: string): InspeccionResponseDto | undefined {
    const inspeccion = this.repository.findById(id);
    return inspeccion ? this.toResponseDto(inspeccion) : undefined;
  }

  /** Verifica si un vehículo tiene inspección aprobada (última inspección) */
  verificarInspeccion(vehiculoId: string): { aprobado: boolean; inspeccion?: InspeccionResponseDto } {
    const inspeccion = this.repository.findByVehiculoId(vehiculoId);
    if (!inspeccion) return { aprobado: false };
    return {
      aprobado: inspeccion.resultado === 'aprobado',
      inspeccion: this.toResponseDto(inspeccion),
    };
  }

  create(dto: CreateInspeccionDto): InspeccionResponseDto {
    const inspeccion = this.repository.create(dto);
    return this.toResponseDto(inspeccion);
  }

  update(id: string, dto: UpdateInspeccionDto): InspeccionResponseDto | undefined {
    const inspeccion = this.repository.update(id, dto);
    return inspeccion ? this.toResponseDto(inspeccion) : undefined;
  }

  delete(id: string): boolean {
    return this.repository.delete(id);
  }
}
