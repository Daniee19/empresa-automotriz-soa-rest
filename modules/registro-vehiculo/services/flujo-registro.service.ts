/**
 * FlujoRegistroVehiculo — Servicio de Tarea SOA (Compositor / Orquestador).
 *
 * Composición — Registro e Inspección de Vehículo
 * Patrón: Chain (cadena secuencial)
 * Tipo de invocación: Secuencial — cada servicio depende del resultado anterior
 * Trigger: El asesor registra un vehículo seminuevo en la plataforma
 *
 * Flujo de orquestación:
 *   1. SVC-08 ServicioAutenticacion  → validarToken
 *   2. SVC-01 ServicioVehiculo       → registrarVehiculo (datosVehiculo) → idVehiculo
 *   3. SVC-03 ServicioInspeccion     → registrarInspeccion (idVehiculo + checklist)
 *   4. SVC-03 ServicioInspeccion     → validarEstadoVehiculo (idVehiculo) → estado APROBADO
 *   5. SVC-06 ServicioPrecio         → calcularPrecioMercado (idVehiculo) → precio referencial
 *   6. SVC-07 ServicioNotificacion   → enviarNotificacion (correoCliente + resultado) → ENVIADO
 *
 * Comunicación SOA: Todas las llamadas se realizan vía HTTP (axios)
 * a los endpoints REST de cada servicio, pasando por sus controladores.
 *
 * Comportamiento ante error:
 *   Si el vehículo no aprueba la inspección, el flujo se detiene y el
 *   vehículo queda en estado OBSERVADO. Los pasos 5 y 6 no se ejecutan
 *   hasta corregir las observaciones detectadas.
 */

import apiClient from '@/modules/shared/api-client';

/** Datos de entrada para registrar un vehículo con inspección */
export interface RegistroVehiculoDto {
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  precio: number;
  placa: string;
  vin: string;
  resultadoInspeccion: 'aprobado' | 'rechazado';
  observaciones: string;
  inspector: string;
  correoNotificacion: string;
}

/** Resultado del flujo de registro */
export interface RegistroVehiculoResultado {
  vehiculo: { id: string; marca: string; modelo: string; estado: string };
  inspeccion: { id: string; resultado: string; observaciones: string };
  estadoVehiculo: string;
  precioReferencial?: { precioCalculado: number; factorDepreciacion: number; factorMarca: number };
  notificacion?: { id: string; estado: string };
  pasos: string[];
}

export class FlujoRegistroService {
  /**
   * Ejecuta el flujo de registro e inspección — Patrón Chain (secuencial).
   * Todas las llamadas se hacen vía HTTP a los endpoints REST.
   */
  async registrar(dto: RegistroVehiculoDto, token: string): Promise<{ exito: true; resultado: RegistroVehiculoResultado } | { exito: false; error: string; errorCode: string; resultadoParcial?: Partial<RegistroVehiculoResultado> }> {
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

    // --- Paso 2: SVC-01 POST /api/v1/vehiculos → registrarVehiculo ---
    const vehiculoRes = await apiClient.post('/vehiculos', {
      marca: dto.marca,
      modelo: dto.modelo,
      anio: dto.anio,
      color: dto.color,
      precio: dto.precio,
      placa: dto.placa,
      vin: dto.vin,
    });
    const vehiculo = vehiculoRes.data.data;
    pasos.push(`2. Vehículo registrado: ${vehiculo.id} — ${vehiculo.marca} ${vehiculo.modelo}`);

    // --- Paso 3: SVC-03 POST /api/v1/inspecciones → registrarInspeccion ---
    const inspeccionRes = await apiClient.post('/inspecciones', {
      vehiculoId: vehiculo.id,
      resultado: dto.resultadoInspeccion,
      observaciones: dto.observaciones,
      inspector: dto.inspector,
    });
    const inspeccion = inspeccionRes.data.data;
    pasos.push(`3. Inspección registrada: ${inspeccion.id} — resultado: ${inspeccion.resultado}`);

    // --- Paso 4: SVC-03 GET /api/v1/inspecciones/estado/{vehiculoId} → validarEstadoVehiculo ---
    const estadoRes = await apiClient.get(`/inspecciones/estado/${vehiculo.id}`);
    const estado = estadoRes.data.data;
    pasos.push(`4. Estado técnico validado: ${estado.estado}`);

    if (estado.estado !== 'APROBADO') {
      // El vehículo queda en estado OBSERVADO — pasos 5 y 6 no se ejecutan
      await apiClient.put(`/vehiculos/${vehiculo.id}`, { estado: 'en_inspeccion' });
      pasos.push('⚠ Flujo detenido: vehículo no aprobó inspección. Queda en estado OBSERVADO.');
      return {
        exito: false,
        error: 'El vehículo no aprobó la inspección técnica. Queda en estado OBSERVADO hasta corregir las observaciones.',
        errorCode: 'INSPECCION_NO_APROBADA',
        resultadoParcial: {
          vehiculo: { id: vehiculo.id, marca: vehiculo.marca, modelo: vehiculo.modelo, estado: 'en_inspeccion' },
          inspeccion: { id: inspeccion.id, resultado: inspeccion.resultado, observaciones: inspeccion.observaciones },
          estadoVehiculo: 'OBSERVADO',
          pasos,
        },
      };
    }

    // --- Paso 5: SVC-06 POST /api/v1/calcular-precio → calcularPrecioMercado ---
    const precioRes = await apiClient.post('/calcular-precio', {
      vehiculoId: vehiculo.id,
      precioBase: dto.precio,
      anio: dto.anio,
      marca: dto.marca,
    });
    const precio = precioRes.data.data;
    // Actualizar el precio del vehículo con el calculado
    await apiClient.put(`/vehiculos/${vehiculo.id}`, { precio: precio.precioCalculado });
    pasos.push(`5. Precio referencial calculado: $${precio.precioCalculado}`);

    // --- Paso 6: SVC-07 POST /api/v1/enviar-notificacion → enviarNotificacion ---
    const notifRes = await apiClient.post('/enviar-notificacion', {
      destinatario: dto.correoNotificacion,
      asunto: `Vehículo registrado — ${vehiculo.marca} ${vehiculo.modelo}`,
      mensaje: `El vehículo ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placa}) ha sido registrado exitosamente. Inspección: ${inspeccion.resultado}. Precio referencial: $${precio.precioCalculado}.`,
      tipo: 'email',
    });
    const notificacion = notifRes.data.data;
    pasos.push(`6. Notificación enviada: ${notificacion.id}`);

    return {
      exito: true,
      resultado: {
        vehiculo: { id: vehiculo.id, marca: vehiculo.marca, modelo: vehiculo.modelo, estado: 'disponible' },
        inspeccion: { id: inspeccion.id, resultado: inspeccion.resultado, observaciones: inspeccion.observaciones },
        estadoVehiculo: 'APROBADO',
        precioReferencial: {
          precioCalculado: precio.precioCalculado,
          factorDepreciacion: precio.factorDepreciacion,
          factorMarca: precio.factorMarca,
        },
        notificacion: { id: notificacion.id, estado: notificacion.estado },
        pasos,
      },
    };
  }
}
