/**
 * FlujoSubastaVehiculo — Servicio de Tarea SOA (Compositor / Orquestador).
 *
 * Composición — Proceso de Subasta
 * Patrón: Router condicional + Chain
 * Tipo de invocación: Condicional — el flujo cambia según el estado de la subasta
 * Trigger: Un usuario realiza una oferta en una subasta activa
 *
 * Flujo de orquestación:
 *   1. SVC-08 ServicioAutenticacion  → validarToken(usuario)
 *   2. SVC-05 ServicioSubasta        → registrarOferta(idSubasta, montoOferta)
 *   3. Router condicional            → ¿montoOferta > ofertaActual? → paso 4 / rechazar
 *   4. SVC-05 ServicioSubasta        → actualizarOfertaGanadora()
 *   5. SVC-07 ServicioNotificacion   → enviarNotificacion al ofertante anterior
 *   6. SVC-07 ServicioNotificacion   → enviarNotificacion al nuevo líder
 *
 * Comunicación SOA: Todas las llamadas se realizan vía HTTP (axios)
 * a los endpoints REST de cada servicio, pasando por sus controladores.
 *
 * Comportamiento ante error:
 *   Si el monto ofertado es menor o igual a la oferta actual, retorna
 *   OFERTA_INVALIDA y no ejecuta los pasos de actualización ni notificación.
 *   Si el servicio de notificaciones falla, la oferta permanece registrada
 *   y se ejecuta un retry automático de hasta 3 intentos.
 */

import apiClient from '@/modules/shared/api-client';

/** Datos de entrada para procesar una oferta */
export interface ProcesarOfertaDto {
  subastaId: string;
  clienteId: string;
  montoOferta: number;
}

/** Resultado del proceso de oferta */
export interface ProcesarOfertaResultado {
  subastaId: string;
  ofertaAceptada: boolean;
  montoOferta: number;
  precioAnterior: number;
  ganadorAnterior: string | null;
  notificaciones: { ofertanteAnterior?: string; nuevoLider?: string };
  pasos: string[];
}

const MAX_REINTENTOS_NOTIFICACION = 3;

export class FlujoSubastaService {
  /**
   * Ejecuta el flujo de oferta — Patrón Router condicional + Chain.
   * Todas las llamadas se hacen vía HTTP a los endpoints REST.
   */
  async procesarOferta(dto: ProcesarOfertaDto, token: string): Promise<{ exito: true; resultado: ProcesarOfertaResultado } | { exito: false; error: string; errorCode: string }> {
    const pasos: string[] = [];
    const authHeader = { Authorization: `Bearer ${token}` };

    // --- Paso 1: SVC-08 POST /api/v1/validar-token → validarToken ---
    try {
      const authRes = await apiClient.post('/validar-token', {}, { headers: authHeader });
      const auth = authRes.data.data;
      if (!auth.valido) {
        return { exito: false, error: 'Token de autenticación inválido o expirado', errorCode: 'TOKEN_INVALIDO' };
      }
      pasos.push(`1. Token validado para usuario: ${auth.usuario}`);
    } catch {
      return { exito: false, error: 'Token de autenticación inválido o expirado', errorCode: 'TOKEN_INVALIDO' };
    }

    // Obtener estado actual de la subasta antes de la oferta
    let subastaActual: { precioActual: number; ganadorId: string | null };
    try {
      const subastaRes = await apiClient.get(`/subastas/${dto.subastaId}`);
      subastaActual = subastaRes.data.data;
    } catch {
      return { exito: false, error: 'Subasta no encontrada', errorCode: 'SUBASTA_NOT_FOUND' };
    }
    const precioAnterior = subastaActual.precioActual;
    const ganadorAnterior = subastaActual.ganadorId;

    // --- Paso 2: SVC-05 POST /api/v1/subastas/registrar-oferta → registrarOferta ---
    // --- Paso 3: Router condicional → ¿montoOferta > ofertaActual? ---
    try {
      const ofertaRes = await apiClient.post('/subastas/registrar-oferta', {
        subastaId: dto.subastaId,
        montoOferta: dto.montoOferta,
        clienteId: dto.clienteId,
      });
      const resultado = ofertaRes.data.data;
      if (!resultado.aceptada) {
        pasos.push(`2. Oferta rechazada: ${resultado.motivo}`);
        pasos.push('3. Router condicional: montoOferta <= ofertaActual → RECHAZADA');
        return { exito: false, error: resultado.motivo || 'Oferta inválida', errorCode: 'OFERTA_INVALIDA' };
      }
      pasos.push(`2. Oferta registrada: $${dto.montoOferta}`);
      pasos.push('3. Router condicional: montoOferta > ofertaActual → ACEPTADA');
    } catch (err: unknown) {
      // El controlador retorna 400 si la oferta es rechazada
      const error = err as { response?: { data?: { message?: string } } };
      const motivo = error.response?.data?.message || 'Oferta inválida';
      pasos.push(`2. Oferta rechazada: ${motivo}`);
      pasos.push('3. Router condicional: montoOferta <= ofertaActual → RECHAZADA');
      return { exito: false, error: motivo, errorCode: 'OFERTA_INVALIDA' };
    }

    // --- Paso 4: SVC-05 ServicioSubasta → actualizarOfertaGanadora (ya se hizo en registrarOferta) ---
    pasos.push(`4. Oferta ganadora actualizada: cliente ${dto.clienteId} con $${dto.montoOferta}`);

    // --- Paso 5: SVC-07 ServicioNotificacion → notificar al ofertante anterior ---
    const notificaciones: { ofertanteAnterior?: string; nuevoLider?: string } = {};

    if (ganadorAnterior) {
      try {
        const clienteAnteriorRes = await apiClient.get(`/clientes/${ganadorAnterior}`);
        const clienteAnterior = clienteAnteriorRes.data.data;
        const notifId = await this.enviarConReintento(
          clienteAnterior.email,
          `Subasta ${dto.subastaId} — Ha sido superado`,
          `Su oferta de $${precioAnterior} ha sido superada por una oferta de $${dto.montoOferta}. Puede realizar una nueva oferta.`,
        );
        notificaciones.ofertanteAnterior = notifId;
        pasos.push(`5. Notificación enviada al ofertante anterior: ${clienteAnterior.email}`);
      } catch {
        pasos.push('5. Ofertante anterior no encontrado — notificación omitida');
      }
    } else {
      pasos.push('5. Sin ofertante anterior — notificación omitida');
    }

    // --- Paso 6: SVC-07 ServicioNotificacion → notificar al nuevo líder ---
    try {
      const nuevoLiderRes = await apiClient.get(`/clientes/${dto.clienteId}`);
      const nuevoLider = nuevoLiderRes.data.data;
      const notifId = await this.enviarConReintento(
        nuevoLider.email,
        `Subasta ${dto.subastaId} — Usted lidera`,
        `¡Felicidades! Su oferta de $${dto.montoOferta} es actualmente la más alta en la subasta.`,
      );
      notificaciones.nuevoLider = notifId;
      pasos.push(`6. Notificación enviada al nuevo líder: ${nuevoLider.email}`);
    } catch {
      pasos.push('6. Cliente nuevo líder no encontrado — notificación omitida');
    }

    return {
      exito: true,
      resultado: {
        subastaId: dto.subastaId,
        ofertaAceptada: true,
        montoOferta: dto.montoOferta,
        precioAnterior,
        ganadorAnterior,
        notificaciones,
        pasos,
      },
    };
  }

  /** Envía notificación con retry automático de hasta 3 intentos vía HTTP */
  private async enviarConReintento(destinatario: string, asunto: string, mensaje: string): Promise<string> {
    for (let intento = 1; intento <= MAX_REINTENTOS_NOTIFICACION; intento++) {
      try {
        const res = await apiClient.post('/enviar-notificacion', {
          destinatario,
          asunto,
          mensaje,
          tipo: 'email',
        });
        return res.data.data.id;
      } catch {
        console.log(`[RETRY] Intento ${intento}/${MAX_REINTENTOS_NOTIFICACION} falló para ${destinatario}`);
        if (intento === MAX_REINTENTOS_NOTIFICACION) {
          console.log(`[RETRY] Se agotaron los reintentos para ${destinatario}`);
          return 'FALLO_NOTIFICACION';
        }
      }
    }
    return 'FALLO_NOTIFICACION';
  }
}
