/**
 * DTOs para el módulo Vehículo.
 * Separan la representación externa (API) del modelo interno de dominio.
 */

import { EstadoVehiculo } from '../models/vehiculo.model';

/** Datos requeridos para registrar un vehículo nuevo */
export interface CreateVehiculoDto {
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  precio: number;
  placa: string;
  vin: string;
}

/** Campos opcionales para actualización parcial de un vehículo */
export interface UpdateVehiculoDto {
  marca?: string;
  modelo?: string;
  anio?: number;
  color?: string;
  precio?: number;
  estado?: EstadoVehiculo;
  placa?: string;
}

/** Estructura que se devuelve al cliente en las respuestas */
export interface VehiculoResponseDto {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  precio: number;
  estado: EstadoVehiculo;
  placa: string;
  vin: string;
}
