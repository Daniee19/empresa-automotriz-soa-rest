/**
 * AutenticacionController — Controlador del Servicio de Utilidad "Autenticación".
 * Gestiona login y validación de tokens ficticios.
 */

import { AutenticacionService, CredencialesDto } from '../services/autenticacion.service';
import { successResponse, errorResponse, jsonResponse, parseBody } from '@/modules/shared/helpers';

export class AutenticacionController {
  private service = new AutenticacionService();

  /** POST /api/v1/autenticar — Autentica al usuario y devuelve un token */
  async autenticar(request: Request): Promise<Response> {
    const credenciales = await parseBody<CredencialesDto>(request);

    if (!credenciales.usuario || !credenciales.contrasena) {
      return jsonResponse(
        errorResponse('Se requieren usuario y contraseña', 'CREDENCIALES_REQUERIDAS'),
        400
      );
    }

    const resultado = this.service.autenticar(credenciales);
    if (!resultado) {
      return jsonResponse(
        errorResponse('Credenciales inválidas', 'CREDENCIALES_INVALIDAS'),
        401
      );
    }

    return jsonResponse(successResponse(resultado, 'Autenticación exitosa'));
  }

  /** POST /api/v1/validar-token — Valida un token y retorna si es válido */
  async validarToken(request: Request): Promise<Response> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse(
        errorResponse('Se requiere header Authorization con formato Bearer <token>', 'AUTH_REQUERIDA'),
        401
      );
    }
    const token = authHeader.replace('Bearer ', '');
    const resultado = this.service.validarToken(token);

    if (!resultado.valido) {
      return jsonResponse(errorResponse('Token inválido o expirado', 'TOKEN_INVALIDO'), 401);
    }

    return jsonResponse(successResponse(resultado, 'Token válido'));
  }
}
