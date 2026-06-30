/**
 * ServicioProcesarVenta — Servicio de Tarea SOA (Orquestador).
 *
 * Este es el ÚNICO servicio que coordina el flujo completo de venta.
 * Ningún otro servicio llama a otro directamente; toda la comunicación
 * entre servicios pasa por este orquestador.
 *
 * Flujo de orquestación:
 *   1. Validar token de autenticación
 *   2. Obtener datos del cliente
 *   3. Obtener datos del vehículo
 *   4. Verificar inspección aprobada
 *   5. Verificar que el vehículo no esté en subasta activa
 *   6. Registrar la venta
 *   7. Actualizar estado del vehículo a "vendido"
 *   8. Enviar notificación de confirmación
 */

import { AutenticacionService } from '@/modules/autenticacion/services/autenticacion.service';
import { ClienteService } from '@/modules/cliente/services/cliente.service';
import { VehiculoService } from '@/modules/vehiculo/services/vehiculo.service';
import { InspeccionService } from '@/modules/inspeccion/services/inspeccion.service';
import { SubastaService } from '@/modules/subasta/services/subasta.service';
import { VentaService } from './venta.service';
import { NotificacionService } from '@/modules/notificacion/services/notificacion.service';
import { IntegracionCRMService } from '@/modules/integracion-crm/services/integracion-crm.service';

/** Datos de entrada para procesar una venta */
export interface ProcesarVentaDto {
  clienteId: string;
  vehiculoId: string;
  precioOfertado: number;
}

/** Resultado completo del proceso de venta con trazabilidad de cada paso */
export interface ProcesarVentaResultado {
  venta: {
    id: string;
    clienteId: string;
    vehiculoId: string;
    precioFinal: number;
    fecha: string;
    estado: string;
  };
  cliente: { id: string; nombre: string; apellido: string; email: string };
  vehiculo: { id: string; marca: string; modelo: string; estado: string };
  inspeccion: { aprobado: boolean; id?: string };
  notificacion: { id: string; estado: string };
  crm: { id: string; crmReferencia: string };
  pasos: string[]; // Registro de cada paso ejecutado exitosamente
}

export class ProcesarVentaService {
  // Instancias de cada servicio que el orquestador coordinará
  private autenticacionService = new AutenticacionService();
  private clienteService = new ClienteService();
  private vehiculoService = new VehiculoService();
  private inspeccionService = new InspeccionService();
  private subastaService = new SubastaService();
  private ventaService = new VentaService();
  private notificacionService = new NotificacionService();
  private crmService = new IntegracionCRMService();

  /**
   * Ejecuta el flujo completo de venta orquestando todos los servicios.
   * Si cualquier paso falla, se detiene y devuelve el error correspondiente.
   */
  async procesar(dto: ProcesarVentaDto, token: string): Promise<{ exito: true; resultado: ProcesarVentaResultado } | { exito: false; error: string; errorCode: string }> {
    const pasos: string[] = [];

    // --- Paso 1: Validar token de autenticación ---
    const auth = this.autenticacionService.validarToken(token);
    if (!auth.valido) {
      return { exito: false, error: 'Token de autenticación inválido o expirado', errorCode: 'TOKEN_INVALIDO' };
    }
    pasos.push(`1. Token validado para usuario: ${auth.usuario}`);

    // --- Paso 2: Obtener datos del cliente ---
    const cliente = this.clienteService.findById(dto.clienteId);
    if (!cliente) {
      return { exito: false, error: `Cliente con ID ${dto.clienteId} no encontrado`, errorCode: 'CLIENTE_NOT_FOUND' };
    }
    pasos.push(`2. Cliente obtenido: ${cliente.nombre} ${cliente.apellido}`);

    // --- Paso 3: Obtener datos del vehículo ---
    const vehiculo = this.vehiculoService.findById(dto.vehiculoId);
    if (!vehiculo) {
      return { exito: false, error: `Vehículo con ID ${dto.vehiculoId} no encontrado`, errorCode: 'VEHICULO_NOT_FOUND' };
    }
    if (vehiculo.estado === 'vendido') {
      return { exito: false, error: 'El vehículo ya fue vendido', errorCode: 'VEHICULO_VENDIDO' };
    }
    pasos.push(`3. Vehículo obtenido: ${vehiculo.marca} ${vehiculo.modelo}`);

    // --- Paso 4: Verificar inspección aprobada ---
    const inspeccion = this.inspeccionService.verificarInspeccion(dto.vehiculoId);
    if (!inspeccion.aprobado) {
      return { exito: false, error: 'El vehículo no tiene inspección aprobada', errorCode: 'INSPECCION_NO_APROBADA' };
    }
    pasos.push(`4. Inspección verificada: aprobada (${inspeccion.inspeccion?.id})`);

    // --- Paso 5: Verificar que no esté en subasta activa ---
    const subasta = this.subastaService.verificarDisponibilidad(dto.vehiculoId);
    if (!subasta.disponible) {
      return { exito: false, error: 'El vehículo tiene una subasta activa y no puede venderse directamente', errorCode: 'VEHICULO_EN_SUBASTA' };
    }
    pasos.push('5. Verificado: sin subasta activa');

    // --- Paso 6: Registrar la venta ---
    const venta = this.ventaService.create({
      clienteId: dto.clienteId,
      vehiculoId: dto.vehiculoId,
      precioFinal: dto.precioOfertado,
    });
    pasos.push(`6. Venta registrada: ${venta.id}`);

    // --- Paso 7: Actualizar estado del vehículo a "vendido" ---
    this.vehiculoService.update(dto.vehiculoId, { estado: 'vendido' });
    pasos.push('7. Estado del vehículo actualizado a "vendido"');

    // --- Paso 8: Enviar notificación de confirmación ---
    const notificacion = this.notificacionService.enviarNotificacion({
      destinatario: cliente.email,
      asunto: `Confirmación de compra - ${vehiculo.marca} ${vehiculo.modelo}`,
      mensaje: `Estimado/a ${cliente.nombre}, su compra del vehículo ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placa}) ha sido procesada exitosamente. Precio final: $${dto.precioOfertado}`,
      tipo: 'email',
    });
    pasos.push(`8. Notificación enviada: ${notificacion.id}`);

    // --- Bonus: Sincronizar con CRM ---
    const crm = this.crmService.sincronizar({
      entidad: 'venta',
      accion: 'crear',
      datos: { ventaId: venta.id, clienteId: cliente.id, vehiculoId: vehiculo.id, precio: dto.precioOfertado },
    });
    pasos.push(`9. CRM sincronizado: ${crm.crmReferencia}`);

    return {
      exito: true,
      resultado: {
        venta: {
          id: venta.id,
          clienteId: venta.clienteId,
          vehiculoId: venta.vehiculoId,
          precioFinal: venta.precioFinal,
          fecha: venta.fecha,
          estado: venta.estado,
        },
        cliente: { id: cliente.id, nombre: cliente.nombre, apellido: cliente.apellido, email: cliente.email },
        vehiculo: { id: vehiculo.id, marca: vehiculo.marca, modelo: vehiculo.modelo, estado: 'vendido' },
        inspeccion: { aprobado: true, id: inspeccion.inspeccion?.id },
        notificacion: { id: notificacion.id, estado: notificacion.estado },
        crm: { id: crm.id, crmReferencia: crm.crmReferencia },
        pasos,
      },
    };
  }
}
