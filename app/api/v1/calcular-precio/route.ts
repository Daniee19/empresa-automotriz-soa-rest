/**
 * Route Handler para POST /api/v1/calcular-precio
 * Servicio de Tarea SOA — expuesto como verbo (acción de negocio).
 * Calcula el precio referencial de un vehículo.
 */

import { PrecioController } from '@/modules/precio/controllers/precio.controller';

const controller = new PrecioController();

export async function POST(request: Request) {
  return controller.calcular(request);
}
