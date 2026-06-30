/**
 * DTOs para el módulo Inspección.
 * Gestionan la entrada/salida de datos de inspecciones técnicas.
 */

import { ResultadoInspeccion } from '../models/inspeccion.model';

/** Datos requeridos para registrar una inspección */
export interface CreateInspeccionDto {
  vehiculoId: string;
  resultado: ResultadoInspeccion;
  observaciones: string;
  inspector: string;
}

/** Campos opcionales para actualizar una inspección */
export interface UpdateInspeccionDto {
  resultado?: ResultadoInspeccion;
  observaciones?: string;
  inspector?: string;
}

/** Estructura devuelta al consumidor de la API */
export interface InspeccionResponseDto {
  id: string;
  vehiculoId: string;
  fecha: string;
  resultado: ResultadoInspeccion;
  observaciones: string;
  inspector: string;
}
