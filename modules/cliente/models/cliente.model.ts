/**
 * Modelo de dominio para Cliente.
 * Representa a un comprador o interesado registrado en el sistema.
 */

export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  documento: string; // DNI, RUC u otro documento de identidad
}
