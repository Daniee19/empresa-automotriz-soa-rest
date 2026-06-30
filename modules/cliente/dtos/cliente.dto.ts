/**
 * DTOs para el módulo Cliente.
 * Controlan qué datos entran y salen de la API de clientes.
 */

/** Datos requeridos para registrar un cliente nuevo */
export interface CreateClienteDto {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  documento: string;
}

/** Campos opcionales para actualización parcial */
export interface UpdateClienteDto {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
}

/** Estructura devuelta al consumidor de la API */
export interface ClienteResponseDto {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  documento: string;
}
