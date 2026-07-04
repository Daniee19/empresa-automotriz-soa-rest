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
 * Comportamiento ante error:
 *   Si el monto ofertado es menor o igual a la oferta actual, retorna
 *   OFERTA_INVALIDA y no ejecuta los pasos de actualización ni notificación.
 *   Si el servicio de notificaciones falla, la oferta permanece registrada
 *   y se ejecuta un retry automático de hasta 3 intentos.
 */

import { AutenticacionService } from '@/modules/autenticacion/services/autenticacion.service';
import { SubastaService } from '@/modules/subasta/services/subasta.service';
import { ClienteService } from '@/modules/cliente/services/cliente.service';
import { NotificacionService } from '@/modules/notificacion/services/notificacion.service';

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
  private autenticacionService = new AutenticacionService();
  private subastaService = new SubastaService();
  private clienteService = new ClienteService();
  private notificacionService = new NotificacionService();

  /**
   * Ejecuta el flujo de oferta — Patrón Router condicional + Chain.
   */
  async procesarOferta(dto: ProcesarOfertaDto, token: string): Promise<{ exito: true; resultado: ProcesarOfertaResultado } | { exito: false; error: string; errorCode: string }> {
    const pasos: string[] = [];

    // --- Paso 1: SVC-08 ServicioAutenticacion → validarToken ---
    const auth = this.autenticacionService.validarToken(token);
    if (!auth.valido) {
      return { exito: false, error: 'Token de autenticación inválido o expirado', errorCode: 'TOKEN_INVALIDO' };
    }
    pasos.push(`1. Token validado para usuario: ${auth.usuario}`);

    // Obtener estado actual de la subasta antes de la oferta
    const subastaActual = this.subastaService.findById(dto.subastaId);
    if (!subastaActual) {
      return { exito: false, error: 'Subasta no encontrada', errorCode: 'SUBASTA_NOT_FOUND' };
    }
    const precioAnterior = subastaActual.precioActual;
    const ganadorAnterior = subastaActual.ganadorId;

    // --- Paso 2: SVC-05 ServicioSubasta → registrarOferta ---
    // --- Paso 3: Router condicional → ¿montoOferta > ofertaActual? ---
    const resultado = this.subastaService.registrarOferta(dto.subastaId, dto.montoOferta, dto.clienteId);

    if (!resultado.aceptada) {
      // Router: oferta rechazada → flujo se detiene
      pasos.push(`2. Oferta rechazada: ${resultado.motivo}`);
      pasos.push('3. Router condicional: montoOferta <= ofertaActual → RECHAZADA');
      return { exito: false, error: resultado.motivo || 'Oferta inválida', errorCode: 'OFERTA_INVALIDA' };
    }
    pasos.push(`2. Oferta registrada: $${dto.montoOferta}`);
    pasos.push('3. Router condicional: montoOferta > ofertaActual → ACEPTADA');

    // --- Paso 4: SVC-05 ServicioSubasta → actualizarOfertaGanadora (ya se hizo en registrarOferta) ---
    pasos.push(`4. Oferta ganadora actualizada: cliente ${dto.clienteId} con $${dto.montoOferta}`);

    // --- Paso 5: SVC-07 ServicioNotificacion → notificar al ofertante anterior ---
    const notificaciones: { ofertanteAnterior?: string; nuevoLider?: string } = {};

    if (ganadorAnterior) {
      const clienteAnterior = this.clienteService.findById(ganadorAnterior);
      if (clienteAnterior) {
        const notifAnterior = await this.enviarConReintento(
          clienteAnterior.email,
          `Subasta ${dto.subastaId} — Ha sido superado`,
          `Su oferta de $${precioAnterior} ha sido superada por una oferta de $${dto.montoOferta}. Puede realizar una nueva oferta.`,
        );
        notificaciones.ofertanteAnterior = notifAnterior;
        pasos.push(`5. Notificación enviada al ofertante anterior: ${clienteAnterior.email}`);
      } else {
        pasos.push('5. Ofertante anterior no encontrado — notificación omitida');
      }
    } else {
      pasos.push('5. Sin ofertante anterior — notificación omitida');
    }

    // --- Paso 6: SVC-07 ServicioNotificacion → notificar al nuevo líder ---
    const nuevoLider = this.clienteService.findById(dto.clienteId);
    if (nuevoLider) {
      const notifLider = await this.enviarConReintento(
        nuevoLider.email,
        `Subasta ${dto.subastaId} — Usted lidera`,
        `¡Felicidades! Su oferta de $${dto.montoOferta} es actualmente la más alta en la subasta.`,
      );
      notificaciones.nuevoLider = notifLider;
      pasos.push(`6. Notificación enviada al nuevo líder: ${nuevoLider.email}`);
    } else {
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

  /** Envía notificación con retry automático de hasta 3 intentos */
  private async enviarConReintento(destinatario: string, asunto: string, mensaje: string): Promise<string> {
    for (let intento = 1; intento <= MAX_REINTENTOS_NOTIFICACION; intento++) {
      try {
        const notif = this.notificacionService.enviarNotificacion({
          destinatario,
          asunto,
          mensaje,
          tipo: 'email',
        });
        return notif.id;
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
