/**
 * Repositorio de Inspecciones — almacenamiento en memoria.
 * Guarda las revisiones técnicas realizadas a los vehículos.
 */

import { Inspeccion } from '../models/inspeccion.model';

export class InspeccionRepository {
  /** Almacén en memoria con inspecciones de prueba */
  private static inspecciones: Inspeccion[] = [
    {
      id: 'IN-001',
      vehiculoId: 'VH-001',
      fecha: '2024-01-10T09:00:00Z',
      resultado: 'aprobado',
      observaciones: 'Vehículo en excelentes condiciones mecánicas y estéticas.',
      inspector: 'Roberto Sánchez',
    },
    {
      id: 'IN-002',
      vehiculoId: 'VH-002',
      fecha: '2024-01-12T14:00:00Z',
      resultado: 'aprobado',
      observaciones: 'Motor y frenos en buen estado. Pintura con desgaste menor.',
      inspector: 'Ana Torres',
    },
    {
      id: 'IN-003',
      vehiculoId: 'VH-003',
      fecha: '2024-01-14T11:00:00Z',
      resultado: 'rechazado',
      observaciones: 'Problemas en el sistema de frenos. Requiere reparación.',
      inspector: 'Roberto Sánchez',
    },
  ];

  private static nextId = 4;

  findAll(): Inspeccion[] {
    return InspeccionRepository.inspecciones;
  }

  findById(id: string): Inspeccion | undefined {
    return InspeccionRepository.inspecciones.find((i) => i.id === id);
  }

  /** Busca la inspección más reciente de un vehículo */
  findByVehiculoId(vehiculoId: string): Inspeccion | undefined {
    return InspeccionRepository.inspecciones
      .filter((i) => i.vehiculoId === vehiculoId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))[0]; // La más reciente
  }

  create(inspeccion: Omit<Inspeccion, 'id' | 'fecha'>): Inspeccion {
    const nueva: Inspeccion = {
      ...inspeccion,
      id: `IN-${String(InspeccionRepository.nextId++).padStart(3, '0')}`,
      fecha: new Date().toISOString(),
    };
    InspeccionRepository.inspecciones.push(nueva);
    return nueva;
  }

  update(id: string, data: Partial<Inspeccion>): Inspeccion | undefined {
    const index = InspeccionRepository.inspecciones.findIndex((i) => i.id === id);
    if (index === -1) return undefined;
    InspeccionRepository.inspecciones[index] = { ...InspeccionRepository.inspecciones[index], ...data };
    return InspeccionRepository.inspecciones[index];
  }

  delete(id: string): boolean {
    const index = InspeccionRepository.inspecciones.findIndex((i) => i.id === id);
    if (index === -1) return false;
    InspeccionRepository.inspecciones.splice(index, 1);
    return true;
  }
}
