/**
 * ServicioIntegracionCRM — Servicio de Utilidad SOA.
 * Simula la sincronización de datos con un CRM externo.
 * Se expone como verbo: POST /api/v1/sincronizar-crm
 */

/** Datos a sincronizar con el CRM */
export interface SincronizacionCRMDto {
  entidad: 'cliente' | 'venta' | 'vehiculo';
  accion: 'crear' | 'actualizar' | 'eliminar';
  datos: Record<string, unknown>; // Payload genérico
}

/** Resultado de la sincronización simulada */
export interface SincronizacionResultadoDto {
  id: string;
  entidad: string;
  accion: string;
  estado: 'sincronizado';   // Siempre exitoso porque es simulado
  fechaSincronizacion: string;
  crmReferencia: string;    // ID ficticio del registro en el CRM
}

export class IntegracionCRMService {
  /** Registro de sincronizaciones realizadas */
  private static historial: SincronizacionResultadoDto[] = [];
  private static nextId = 1;

  /** Obtiene interacciones simuladas de un cliente desde el CRM */
  obtenerInteracciones(clienteId: string): { clienteId: string; interacciones: number; ultimaInteraccion: string; interes: string } {
    // ponytail: simulado — devuelve datos ficticios basados en el clienteId
    const interacciones = Math.floor(Math.random() * 10) + 1;
    return {
      clienteId,
      interacciones,
      ultimaInteraccion: new Date().toISOString(),
      interes: interacciones > 5 ? 'alto' : interacciones > 2 ? 'medio' : 'bajo',
    };
  }

  /**
   * Simula la sincronización con un CRM externo.
   * En producción, aquí se realizaría una llamada HTTP al CRM real.
   */
  sincronizar(dto: SincronizacionCRMDto): SincronizacionResultadoDto {
    const resultado: SincronizacionResultadoDto = {
      id: `SYNC-${String(IntegracionCRMService.nextId++).padStart(3, '0')}`,
      entidad: dto.entidad,
      accion: dto.accion,
      estado: 'sincronizado',
      fechaSincronizacion: new Date().toISOString(),
      crmReferencia: `CRM-${Date.now()}`, // ID ficticio generado por el "CRM"
    };

    IntegracionCRMService.historial.push(resultado);

    console.log(`[CRM SIMULADO] ${dto.accion} ${dto.entidad} → ${resultado.crmReferencia}`);
    return resultado;
  }
}
