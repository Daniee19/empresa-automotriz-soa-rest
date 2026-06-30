/**
 * ServicioVehiculo — Servicio de Entidad SOA.
 * Encapsula la lógica de negocio CRUD para vehículos.
 * Transforma entre DTOs y modelos de dominio.
 */

import { VehiculoRepository } from '../repositories/vehiculo.repository';
import { CreateVehiculoDto, UpdateVehiculoDto, VehiculoResponseDto } from '../dtos/vehiculo.dto';
import { Vehiculo } from '../models/vehiculo.model';

export class VehiculoService {
  private repository = new VehiculoRepository();

  /** Convierte un modelo de dominio al DTO de respuesta */
  private toResponseDto(vehiculo: Vehiculo): VehiculoResponseDto {
    return {
      id: vehiculo.id,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      color: vehiculo.color,
      precio: vehiculo.precio,
      estado: vehiculo.estado,
      placa: vehiculo.placa,
      vin: vehiculo.vin,
    };
  }

  findAll(): VehiculoResponseDto[] {
    return this.repository.findAll().map(this.toResponseDto);
  }

  findById(id: string): VehiculoResponseDto | undefined {
    const vehiculo = this.repository.findById(id);
    return vehiculo ? this.toResponseDto(vehiculo) : undefined;
  }

  create(dto: CreateVehiculoDto): VehiculoResponseDto {
    const vehiculo = this.repository.create(dto);
    return this.toResponseDto(vehiculo);
  }

  update(id: string, dto: UpdateVehiculoDto): VehiculoResponseDto | undefined {
    const vehiculo = this.repository.update(id, dto);
    return vehiculo ? this.toResponseDto(vehiculo) : undefined;
  }

  delete(id: string): boolean {
    return this.repository.delete(id);
  }
}
