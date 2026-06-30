/**
 * Repositorio de Subastas — almacenamiento en memoria.
 * Gestiona las subastas de vehículos sin persistencia en disco.
 */

import { Subasta } from '../models/subasta.model';

export class SubastaRepository {
  /** Almacén en memoria con subastas de ejemplo */
  private static subastas: Subasta[] = [
    {
      id: 'SB-001',
      vehiculoId: 'VH-003',
      fechaInicio: '2024-02-01T08:00:00Z',
      fechaFin: '2024-02-15T18:00:00Z',
      precioBase: 40000,
      precioActual: 42000,
      estado: 'activa',
      ganadorId: null,
    },
  ];

  private static nextId = 2;

  findAll(): Subasta[] {
    return SubastaRepository.subastas;
  }

  findById(id: string): Subasta | undefined {
    return SubastaRepository.subastas.find((s) => s.id === id);
  }

  /** Busca subastas activas asociadas a un vehículo */
  findActiveByVehiculoId(vehiculoId: string): Subasta | undefined {
    return SubastaRepository.subastas.find(
      (s) => s.vehiculoId === vehiculoId && s.estado === 'activa'
    );
  }

  create(subasta: Omit<Subasta, 'id' | 'precioActual' | 'estado' | 'ganadorId'>): Subasta {
    const nueva: Subasta = {
      ...subasta,
      id: `SB-${String(SubastaRepository.nextId++).padStart(3, '0')}`,
      precioActual: subasta.precioBase, // Inicia igual al precio base
      estado: 'activa',
      ganadorId: null,
    };
    SubastaRepository.subastas.push(nueva);
    return nueva;
  }

  update(id: string, data: Partial<Subasta>): Subasta | undefined {
    const index = SubastaRepository.subastas.findIndex((s) => s.id === id);
    if (index === -1) return undefined;
    SubastaRepository.subastas[index] = { ...SubastaRepository.subastas[index], ...data };
    return SubastaRepository.subastas[index];
  }

  delete(id: string): boolean {
    const index = SubastaRepository.subastas.findIndex((s) => s.id === id);
    if (index === -1) return false;
    SubastaRepository.subastas.splice(index, 1);
    return true;
  }
}
