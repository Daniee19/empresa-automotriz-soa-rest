/**
 * Modelo de dominio para Subasta.
 * Representa un evento de subasta donde se oferta un vehículo al mejor postor.
 */

/** Estados del ciclo de vida de una subasta */
export type EstadoSubasta = 'activa' | 'finalizada' | 'cancelada';

export interface Subasta {
  id: string;
  vehiculoId: string;       // Vehículo en subasta
  fechaInicio: string;      // ISO 8601
  fechaFin: string;         // ISO 8601
  precioBase: number;       // Precio mínimo de apertura
  precioActual: number;     // Mejor oferta actual
  estado: EstadoSubasta;
  ganadorId: string | null; // Cliente ganador (null si aún no hay)
}
