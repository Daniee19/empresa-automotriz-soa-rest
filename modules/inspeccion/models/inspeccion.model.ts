/**
 * Modelo de dominio para Inspección.
 * Registra la revisión técnica realizada a un vehículo antes de su venta o subasta.
 */

/** Resultado posible de una inspección técnica */
export type ResultadoInspeccion = 'aprobado' | 'rechazado';

export interface Inspeccion {
  id: string;
  vehiculoId: string;              // Vehículo inspeccionado
  fecha: string;                   // ISO 8601
  resultado: ResultadoInspeccion;  // Dictamen de la inspección
  observaciones: string;           // Notas del inspector
  inspector: string;               // Nombre del responsable
}
