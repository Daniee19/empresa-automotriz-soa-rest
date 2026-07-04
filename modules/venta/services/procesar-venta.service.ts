/**
 * ServicioProcesarVenta — Servicio de Tarea SOA (Compositor / Orquestador).
 *
 * Composición — Venta Completa de Vehículo
 * Patrón: Chain (cadena secuencial)
 * Tipo de invocación: Secuencial — cada servicio depende del resultado del anterior
 * Trigger: El cliente confirma la compra de un vehículo desde la plataforma web
 *
 * Flujo de orquestación:
 *   1. SVC-08 ServicioAutenticacion  → validarToken
 *   2. SVC-02 ServicioCliente        → consultarCliente (por dniCliente)
 *   3. SVC-01 ServicioVehiculo       → consultarVehiculo
 *   4. SVC-03 ServicioInspeccion     → obtenerEstadoTecnico
 *   5. SVC-05 ServicioSubasta        → validarDisponibilidad
 *   6. SVC-04 ServicioVenta          → registrarVenta
 *   7. SVC-07 ServicioNotificacion   → enviarNotificacion
 *
 * Comportamiento ante error:
 *   - Paso 3 devuelve VEHICULO_NO_DISPONIBLE → se detiene e informa al cliente.
 *   - Paso 4 devuelve INSPECCION_PENDIENTE o INSPECCION_RECHAZADA → no se
 *     ejecutan pasos posteriores hasta regularizar la inspección técnica.
 */

import { AutenticacionService } from '@/modules/autenticacion/services/autenticacion.service';
import { ClienteService } from '@/modules/cliente/services/cliente.service';
import { VehiculoService } from '@/modules/vehiculo/services/vehiculo.service';
import { InspeccionService } from '@/modules/inspeccion/services/inspeccion.service';
import { SubastaService } from '@/modules/subasta/services/subasta.service';
import { VentaService } from './venta.service';
import { NotificacionService } from '@/modules/notificacion/services/notificacion.service';

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
  pasos: string[]; // Registro de cada paso ejecutado exitosamente
}

export class ProcesarVentaService {
  private autenticacionService = new AutenticacionService();
  private clienteService = new ClienteService();
  private vehiculoService = new VehiculoService();
  private inspeccionService = new InspeccionService();
  private subastaService = new SubastaService();
  private ventaService = new VentaService();
  private notificacionService = new NotificacionService();

  /**
   * Ejecuta el flujo completo de venta — Patrón Chain (secuencial).
   * Cada paso depende del resultado del anterior.
   */
  async procesar(dto: ProcesarVentaDto, token: string): Promise<{ exito: true; resultado: ProcesarVentaResultado } | { exito: false; error: string; errorCode: string }> {
    const pasos: string[] = [];

    // --- Paso 1: SVC-08 ServicioAutenticacion → validarToken ---
    const auth = this.autenticacionService.validarToken(token);
    if (!auth.valido) {
      return { exito: false, error: 'Token de autenticación inválido o expirado', errorCode: 'TOKEN_INVALIDO' };
    }
    pasos.push(`1. Token validado para usuario: ${auth.usuario}`);

    // --- Paso 2: SVC-02 ServicioCliente → consultarCliente ---
    const cliente = this.clienteService.findById(dto.clienteId);
    if (!cliente) {
      return { exito: false, error: `Cliente con ID ${dto.clienteId} no encontrado`, errorCode: 'CLIENTE_NOT_FOUND' };
    }
    pasos.push(`2. Cliente obtenido: ${cliente.nombre} ${cliente.apellido}`);

    // --- Paso 3: SVC-01 ServicioVehiculo → consultarVehiculo ---
    const vehiculo = this.vehiculoService.findById(dto.vehiculoId);
    if (!vehiculo) {
      return { exito: false, error: `Vehículo con ID ${dto.vehiculoId} no encontrado`, errorCode: 'VEHICULO_NOT_FOUND' };
    }
    if (vehiculo.estado === 'vendido') {
      return { exito: false, error: 'El vehículo ya no puede ser adquirido (vendido)', errorCode: 'VEHICULO_NO_DISPONIBLE' };
    }
    if (vehiculo.estado !== 'disponible') {
      return { exito: false, error: `El vehículo no está disponible (estado: ${vehiculo.estado})`, errorCode: 'VEHICULO_NO_DISPONIBLE' };
    }
    pasos.push(`3. Vehículo disponible: ${vehiculo.marca} ${vehiculo.modelo}`);

    // --- Paso 4: SVC-03 ServicioInspeccion → obtenerEstadoTecnico ---
    const inspeccion = this.inspeccionService.verificarInspeccion(dto.vehiculoId);
    if (!inspeccion.inspeccion) {
      return { exito: false, error: 'El vehículo no tiene inspección registrada', errorCode: 'INSPECCION_PENDIENTE' };
    }
    if (!inspeccion.aprobado) {
      return { exito: false, error: 'El vehículo no aprobó la inspección técnica', errorCode: 'INSPECCION_RECHAZADA' };
    }
    pasos.push(`4. Inspección aprobada: ${inspeccion.inspeccion.id}`);

    // --- Paso 5: SVC-05 ServicioSubasta → validarDisponibilidad ---
    const subasta = this.subastaService.verificarDisponibilidad(dto.vehiculoId);
    if (!subasta.disponible) {
      return { exito: false, error: 'El vehículo tiene una subasta activa y no puede venderse directamente', errorCode: 'VEHICULO_EN_SUBASTA' };
    }
    pasos.push('5. Verificado: sin subasta activa');

    // --- Paso 6: SVC-04 ServicioVenta → registrarVenta ---
    const venta = this.ventaService.create({
      clienteId: dto.clienteId,
      vehiculoId: dto.vehiculoId,
      precioFinal: dto.precioOfertado,
    });
    pasos.push(`6. Venta registrada: ${venta.id}`);

    // Actualizar estado del vehículo a vendido
    this.vehiculoService.update(dto.vehiculoId, { estado: 'vendido' });

    // --- Paso 7: SVC-07 ServicioNotificacion → enviarNotificacion ---
    const notificacion = this.notificacionService.enviarNotificacion({
      destinatario: cliente.email,
      asunto: `Confirmación de compra - ${vehiculo.marca} ${vehiculo.modelo}`,
      mensaje: `Estimado/a ${cliente.nombre}, su compra del vehículo ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placa}) ha sido procesada exitosamente. Precio final: $${dto.precioOfertado}`,
      tipo: 'email',
    });
    pasos.push(`7. Notificación enviada: ${notificacion.id}`);

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
        pasos,
      },
    };
  }
}
