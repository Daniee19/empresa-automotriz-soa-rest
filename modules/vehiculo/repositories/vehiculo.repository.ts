/**
 * Repositorio de Vehículos — almacenamiento en memoria.
 * Usa un array estático como fuente de datos (sin base de datos).
 * Se inicializa con registros de prueba para facilitar el desarrollo.
 */

import { Vehiculo } from '../models/vehiculo.model';

export class VehiculoRepository {
  /** Almacén en memoria — persiste mientras el servidor esté activo */
  private static vehiculos: Vehiculo[] = [
    {
      id: 'VH-001',
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: 2023,
      color: 'Blanco',
      precio: 25000,
      estado: 'disponible',
      placa: 'ABC-123',
      vin: '1HGBH41JXMN109186',
    },
    {
      id: 'VH-002',
      marca: 'Honda',
      modelo: 'Civic',
      anio: 2022,
      color: 'Negro',
      precio: 22000,
      estado: 'disponible',
      placa: 'DEF-456',
      vin: '2HGBH41JXMN209186',
    },
    {
      id: 'VH-003',
      marca: 'Ford',
      modelo: 'Mustang',
      anio: 2024,
      color: 'Rojo',
      precio: 45000,
      estado: 'en_inspeccion',
      placa: 'GHI-789',
      vin: '3HGBH41JXMN309186',
    },
  ];

  /** Contador auto-incremental para generar IDs únicos */
  private static nextId = 4;

  findAll(): Vehiculo[] {
    return VehiculoRepository.vehiculos;
  }

  findById(id: string): Vehiculo | undefined {
    return VehiculoRepository.vehiculos.find((v) => v.id === id);
  }

  create(vehiculo: Omit<Vehiculo, 'id' | 'estado'>): Vehiculo {
    const nuevo: Vehiculo = {
      ...vehiculo,
      id: `VH-${String(VehiculoRepository.nextId++).padStart(3, '0')}`,
      estado: 'disponible', // Todo vehículo nuevo inicia como disponible
    };
    VehiculoRepository.vehiculos.push(nuevo);
    return nuevo;
  }

  update(id: string, data: Partial<Vehiculo>): Vehiculo | undefined {
    const index = VehiculoRepository.vehiculos.findIndex((v) => v.id === id);
    if (index === -1) return undefined;
    VehiculoRepository.vehiculos[index] = { ...VehiculoRepository.vehiculos[index], ...data };
    return VehiculoRepository.vehiculos[index];
  }

  delete(id: string): boolean {
    const index = VehiculoRepository.vehiculos.findIndex((v) => v.id === id);
    if (index === -1) return false;
    VehiculoRepository.vehiculos.splice(index, 1);
    return true;
  }
}
