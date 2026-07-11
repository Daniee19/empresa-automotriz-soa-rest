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
 * Comunicación SOA: Todas las llamadas se realizan vía HTTP (axios)
 * a los endpoints REST de cada servicio, pasando por sus controladores.
 *
 * Comportamiento ante error:
 *   - Paso 3 devuelve VEHICULO_NO_DISPONIBLE → se detiene e informa al cliente.
 *   - Paso 4 devuelve INSPECCION_PENDIENTE o INSPECCION_RECHAZADA → no se
 *     ejecutan pasos posteriores hasta regularizar la inspección técnica.
 */

import apiClient from '@/modules/shared/api-client';

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
  pasos: string[];
}

export class ProcesarVentaService {
  /**
   * Ejecuta el flujo completo de venta — Patrón Chain (secuencial).
   * Cada paso llama al endpoint REST del servicio correspondiente vía axios.
   */
  async procesar(dto: ProcesarVentaDto, token: string): Promise<{ exito: true; resultado: ProcesarVentaResultado } | { exito: false; error: string; errorCode: string }> {
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

    // --- Paso 2: SVC-02 GET /api/v1/clientes/{id} → consultarCliente ---
    let cliente: { id: string; nombre: string; apellido: string; email: string };
    try {
      const clienteRes = await apiClient.get(`/clientes/${dto.clienteId}`);
      cliente = clienteRes.data.data;
      pasos.push(`2. Cliente obtenido: ${cliente.nombre} ${cliente.apellido}`);
    } catch {
      return { exito: false, error: `Cliente con ID ${dto.clienteId} no encontrado`, errorCode: 'CLIENTE_NOT_FOUND' };
    }

    // --- Paso 3: SVC-01 GET /api/v1/vehiculos/{id} → consultarVehiculo ---
    let vehiculo: { id: string; marca: string; modelo: string; estado: string; placa: string };
    try {
      const vehiculoRes = await apiClient.get(`/vehiculos/${dto.vehiculoId}`);
      vehiculo = vehiculoRes.data.data;
    } catch {
      return { exito: false, error: `Vehículo con ID ${dto.vehiculoId} no encontrado`, errorCode: 'VEHICULO_NOT_FOUND' };
    }
    if (vehiculo.estado === 'vendido') {
      return { exito: false, error: 'El vehículo ya no puede ser adquirido (vendido)', errorCode: 'VEHICULO_NO_DISPONIBLE' };
    }
    if (vehiculo.estado !== 'disponible') {
      return { exito: false, error: `El vehículo no está disponible (estado: ${vehiculo.estado})`, errorCode: 'VEHICULO_NO_DISPONIBLE' };
    }
    pasos.push(`3. Vehículo disponible: ${vehiculo.marca} ${vehiculo.modelo}`);

    // --- Paso 4: SVC-03 GET /api/v1/inspecciones/verificar/{vehiculoId} → obtenerEstadoTecnico ---
    const inspeccionRes = await apiClient.get(`/inspecciones/verificar/${dto.vehiculoId}`);
    const inspeccion = inspeccionRes.data.data;
    if (!inspeccion.inspeccion) {
      return { exito: false, error: 'El vehículo no tiene inspección registrada', errorCode: 'INSPECCION_PENDIENTE' };
    }
    if (!inspeccion.aprobado) {
      return { exito: false, error: 'El vehículo no aprobó la inspección técnica', errorCode: 'INSPECCION_RECHAZADA' };
    }
    pasos.push(`4. Inspección aprobada: ${inspeccion.inspeccion.id}`);

    // --- Paso 5: SVC-05 GET /api/v1/subastas/disponibilidad/{vehiculoId} → validarDisponibilidad ---
    const subastaRes = await apiClient.get(`/subastas/disponibilidad/${dto.vehiculoId}`);
    const subasta = subastaRes.data.data;
    if (!subasta.disponible) {
      return { exito: false, error: 'El vehículo tiene una subasta activa y no puede venderse directamente', errorCode: 'VEHICULO_EN_SUBASTA' };
    }
    pasos.push('5. Verificado: sin subasta activa');

    // --- Paso 6: SVC-04 POST /api/v1/ventas → registrarVenta ---
    const ventaRes = await apiClient.post('/ventas', {
      clienteId: dto.clienteId,
      vehiculoId: dto.vehiculoId,
      precioFinal: dto.precioOfertado,
    });
    const venta = ventaRes.data.data;
    pasos.push(`6. Venta registrada: ${venta.id}`);

    // Actualizar estado del vehículo a vendido
    await apiClient.put(`/vehiculos/${dto.vehiculoId}`, { estado: 'vendido' });

    // --- Paso 7: SVC-07 POST /api/v1/enviar-notificacion → enviarNotificacion ---
    const notifRes = await apiClient.post('/enviar-notificacion', {
      destinatario: cliente.email,
      asunto: `Confirmación de compra - ${vehiculo.marca} ${vehiculo.modelo}`,
      mensaje: `Estimado/a ${cliente.nombre}, su compra del vehículo ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placa}) ha sido procesada exitosamente. Precio final: $${dto.precioOfertado}`,
      tipo: 'email',
    });
    const notificacion = notifRes.data.data;
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
