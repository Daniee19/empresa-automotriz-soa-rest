/**
 * DTOs para el módulo Subasta.
 * Controlan los datos de entrada/salida del servicio de subastas.
 */

import { EstadoSubasta } from '../models/subasta.model';

/** Datos requeridos para crear una subasta */
export interface CreateSubastaDto {
  vehiculoId: string;
  fechaInicio: string;
  fechaFin: string;
  precioBase: number;
}

/** Campos opcionales para actualizar una subasta */
export interface UpdateSubastaDto {
  fechaFin?: string;
  precioActual?: number;
  estado?: EstadoSubasta;
  ganadorId?: string;
}

/** Estructura devuelta al consumidor de la API */
export interface SubastaResponseDto {
  id: string;
  vehiculoId: string;
  fechaInicio: string;
  fechaFin: string;
  precioBase: number;
  precioActual: number;
  estado: EstadoSubasta;
  ganadorId: string | null;
}
