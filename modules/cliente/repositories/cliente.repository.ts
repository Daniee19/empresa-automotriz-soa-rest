/**
 * Repositorio de Clientes — almacenamiento en memoria.
 * Mantiene un array estático con datos de prueba precargados.
 */

import { Cliente } from '../models/cliente.model';

export class ClienteRepository {
  /** Almacén en memoria — persiste mientras el servidor esté activo */
  private static clientes: Cliente[] = [
    {
      id: 'CL-001',
      nombre: 'Carlos',
      apellido: 'García',
      email: 'carlos.garcia@email.com',
      telefono: '987654321',
      documento: '12345678',
    },
    {
      id: 'CL-002',
      nombre: 'María',
      apellido: 'López',
      email: 'maria.lopez@email.com',
      telefono: '912345678',
      documento: '87654321',
    },
    {
      id: 'CL-003',
      nombre: 'Juan',
      apellido: 'Martínez',
      email: 'juan.martinez@email.com',
      telefono: '956789123',
      documento: '11223344',
    },
  ];

  private static nextId = 4;

  findAll(): Cliente[] {
    return ClienteRepository.clientes;
  }

  findById(id: string): Cliente | undefined {
    return ClienteRepository.clientes.find((c) => c.id === id);
  }

  create(cliente: Omit<Cliente, 'id'>): Cliente {
    const nuevo: Cliente = {
      ...cliente,
      id: `CL-${String(ClienteRepository.nextId++).padStart(3, '0')}`,
    };
    ClienteRepository.clientes.push(nuevo);
    return nuevo;
  }

  update(id: string, data: Partial<Cliente>): Cliente | undefined {
    const index = ClienteRepository.clientes.findIndex((c) => c.id === id);
    if (index === -1) return undefined;
    ClienteRepository.clientes[index] = { ...ClienteRepository.clientes[index], ...data };
    return ClienteRepository.clientes[index];
  }

  delete(id: string): boolean {
    const index = ClienteRepository.clientes.findIndex((c) => c.id === id);
    if (index === -1) return false;
    ClienteRepository.clientes.splice(index, 1);
    return true;
  }
}
