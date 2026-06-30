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

  /**
   * Valida un token desde el header Authorization.
   * Usado internamente por la orquestación de procesar-venta.
   */
  validarToken(token: string): { valido: boolean; usuario?: string } {
    return this.service.validarToken(token);
  }
}
