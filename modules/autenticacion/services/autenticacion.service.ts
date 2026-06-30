/**
 * ServicioAutenticacion — Servicio de Utilidad SOA.
 * Simula autenticación con tokens ficticios (sin JWT real ni BD).
 * Se expone como verbo: POST /api/v1/autenticar
 */

/** Credenciales de entrada */
export interface CredencialesDto {
  usuario: string;
  contrasena: string;
}

/** Resultado de autenticación exitosa */
export interface AuthResponseDto {
  token: string;
  usuario: string;
  expiraEn: string; // ISO 8601
}

export class AutenticacionService {
  /** Usuarios ficticios precargados para pruebas */
  private static usuarios = [
    { usuario: 'admin', contrasena: 'admin123', rol: 'administrador' },
    { usuario: 'vendedor', contrasena: 'vend123', rol: 'vendedor' },
    { usuario: 'inspector', contrasena: 'insp123', rol: 'inspector' },
  ];

  /** Tokens activos en memoria — simula una sesión sin persistencia */
  private static tokensActivos = new Map<string, { usuario: string; expira: Date }>();

  /** Valida credenciales y genera un token ficticio si son correctas */
  autenticar(credenciales: CredencialesDto): AuthResponseDto | null {
    const user = AutenticacionService.usuarios.find(
      (u) => u.usuario === credenciales.usuario && u.contrasena === credenciales.contrasena
    );
    if (!user) return null;

    // Token ficticio: base64 del usuario + timestamp
    const token = Buffer.from(`${user.usuario}:${Date.now()}`).toString('base64');
    const expira = new Date(Date.now() + 3600000); // 1 hora de vigencia

    AutenticacionService.tokensActivos.set(token, {
      usuario: user.usuario,
      expira,
    });

    return {
      token,
      usuario: user.usuario,
      expiraEn: expira.toISOString(),
    };
  }

  /** Verifica si un token es válido y no ha expirado */
  validarToken(token: string): { valido: boolean; usuario?: string } {
    const sesion = AutenticacionService.tokensActivos.get(token);
    if (!sesion) return { valido: false };
    if (new Date() > sesion.expira) {
      // Token expirado — se elimina del mapa
      AutenticacionService.tokensActivos.delete(token);
      return { valido: false };
    }
    return { valido: true, usuario: sesion.usuario };
  }
}
