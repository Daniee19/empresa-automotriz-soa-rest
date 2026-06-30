/**
 * Modelo de dominio para Vehículo.
 * Representa un automóvil dentro del inventario de la empresa automotriz.
 */

/** Estados posibles en el ciclo de vida de un vehículo */
export type EstadoVehiculo = 'disponible' | 'vendido' | 'en_subasta' | 'en_inspeccion';

export interface Vehiculo {
  id: string;
  marca: string;
  modelo: string;
  anio: number;           // Año de fabricación
  color: string;
  precio: number;         // Precio base en la moneda local
  estado: EstadoVehiculo; // Estado actual del vehículo
  placa: string;
  vin: string;            // Vehicle Identification Number (único)
}
