/**
 * Repositorio de Ventas — almacenamiento en memoria.
 * Solo gestiona persistencia; la lógica de negocio vive en el servicio.
 */

import { Venta } from '../models/venta.model';

export class VentaRepository {
  /** Almacén en memoria con una venta de ejemplo */
  private static ventas: Venta[] = [
    {
      id: 'VT-001',
      clienteId: 'CL-001',
      vehiculoId: 'VH-001',
      fecha: '2024-01-15T10:30:00Z',
      precioFinal: 24500,
      estado: 'completada',
    },
  ];

  private static nextId = 2;

  findAll(): Venta[] {
    return VentaRepository.ventas;
  }

  findById(id: string): Venta | undefined {
    return VentaRepository.ventas.find((v) => v.id === id);
  }

  create(venta: Omit<Venta, 'id' | 'fecha' | 'estado'>): Venta {
    const nueva: Venta = {
      ...venta,
      id: `VT-${String(VentaRepository.nextId++).padStart(3, '0')}`,
      fecha: new Date().toISOString(),   // Fecha de registro automática
      estado: 'pendiente',               // Toda venta nueva inicia pendiente
    };
    VentaRepository.ventas.push(nueva);
    return nueva;
  }

  update(id: string, data: Partial<Venta>): Venta | undefined {
    const index = VentaRepository.ventas.findIndex((v) => v.id === id);
    if (index === -1) return undefined;
    VentaRepository.ventas[index] = { ...VentaRepository.ventas[index], ...data };
    return VentaRepository.ventas[index];
  }

  delete(id: string): boolean {
    const index = VentaRepository.ventas.findIndex((v) => v.id === id);
    if (index === -1) return false;
    VentaRepository.ventas.splice(index, 1);
    return true;
  }
}
