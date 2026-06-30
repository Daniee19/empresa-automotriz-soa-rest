/**
 * DTOs para el módulo Venta.
 * La creación directa de venta es solo CRUD; la orquestación va en procesar-venta.
 */

import { EstadoVenta } from '../models/venta.model';

/** Datos requeridos para registrar una venta manualmente */
export interface CreateVentaDto {
  clienteId: string;
  vehiculoId: string;
  precioFinal: number;
}

/** Campos opcionales para actualizar una venta existente */
export interface UpdateVentaDto {
  precioFinal?: number;
  estado?: EstadoVenta;
}

/** Estructura devuelta al consumidor de la API */
export interface VentaResponseDto {
  id: string;
  clienteId: string;
  vehiculoId: string;
  fecha: string;
  precioFinal: number;
  estado: EstadoVenta;
}
