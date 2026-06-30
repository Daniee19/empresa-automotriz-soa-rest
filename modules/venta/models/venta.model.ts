/**
 * Modelo de dominio para Venta.
 * Registra la transacción de compra-venta de un vehículo a un cliente.
 */

/** Estados del proceso de venta */
export type EstadoVenta = 'pendiente' | 'completada' | 'cancelada';

export interface Venta {
  id: string;
  clienteId: string;   // Referencia al comprador
  vehiculoId: string;  // Referencia al vehículo vendido
  fecha: string;       // ISO 8601
  precioFinal: number; // Monto acordado de la transacción
  estado: EstadoVenta;
}
