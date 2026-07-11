/**
 * Route Handler para POST /api/v1/validar-token
 * Valida un token de autenticación.
 */

import { AutenticacionController } from '@/modules/autenticacion/controllers/autenticacion.controller';

const controller = new AutenticacionController();

export async function POST(request: Request) {
  return controller.validarToken(request);
}
