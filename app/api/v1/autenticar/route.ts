/**
 * Route Handler para POST /api/v1/autenticar
 * Servicio de Utilidad SOA — autenticación de usuarios.
 * Genera tokens ficticios para simular seguridad.
 */

import { AutenticacionController } from '@/modules/autenticacion/controllers/autenticacion.controller';

const controller = new AutenticacionController();

export async function POST(request: Request) {
  return controller.autenticar(request);
}
