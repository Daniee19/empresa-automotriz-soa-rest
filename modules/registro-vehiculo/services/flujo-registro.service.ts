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
 * Comportamiento ante error:
 *   Si el vehículo no aprueba la inspección, el flujo se detiene y el
 *   vehículo queda en estado OBSERVADO. Los pasos 5 y 6 no se ejecutan
 *   hasta corregir las observaciones detectadas.
 */

import { AutenticacionService } from '@/modules/autenticacion/services/autenticacion.service';
import { VehiculoService } from '@/modules/vehiculo/services/vehiculo.service';
import { InspeccionService } from '@/modules/inspeccion/services/inspeccion.service';
import { PrecioService } from '@/modules/precio/services/precio.service';
import { NotificacionService } from '@/modules/notificacion/services/notificacion.service';

/** Datos de entrada para registrar un vehículo con inspección */
export interface RegistroVehiculoDto {
  // Datos del vehículo
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  precio: number;
  placa: string;
  vin: string;
  // Datos de la inspección
  resultadoInspeccion: 'aprobado' | 'rechazado';
  observaciones: string;
  inspector: string;
  // Notificación
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
  private autenticacionService = new AutenticacionService();
  private vehiculoService = new VehiculoService();
  private inspeccionService = new InspeccionService();
  private precioService = new PrecioService();
  private notificacionService = new NotificacionService();

  /**
   * Ejecuta el flujo de registro e inspección — Patrón Chain (secuencial).
   */
  async registrar(dto: RegistroVehiculoDto, token: string): Promise<{ exito: true; resultado: RegistroVehiculoResultado } | { exito: false; error: string; errorCode: string; resultadoParcial?: Partial<RegistroVehiculoResultado> }> {
    const pasos: string[] = [];

    // --- Paso 1: SVC-08 ServicioAutenticacion → validarToken ---
    const auth = this.autenticacionService.validarToken(token);
    if (!auth.valido) {
      return { exito: false, error: 'Token de autenticación inválido o expirado', errorCode: 'TOKEN_INVALIDO' };
    }
    pasos.push(`1. Token validado para usuario: ${auth.usuario}`);

    // --- Paso 2: SVC-01 ServicioVehiculo → registrarVehiculo ---
    const vehiculo = this.vehiculoService.create({
      marca: dto.marca,
      modelo: dto.modelo,
      anio: dto.anio,
      color: dto.color,
      precio: dto.precio,
      placa: dto.placa,
      vin: dto.vin,
    });
    pasos.push(`2. Vehículo registrado: ${vehiculo.id} — ${vehiculo.marca} ${vehiculo.modelo}`);

    // --- Paso 3: SVC-03 ServicioInspeccion → registrarInspeccion ---
    const inspeccion = this.inspeccionService.create({
      vehiculoId: vehiculo.id,
      resultado: dto.resultadoInspeccion,
      observaciones: dto.observaciones,
      inspector: dto.inspector,
    });
    pasos.push(`3. Inspección registrada: ${inspeccion.id} — resultado: ${inspeccion.resultado}`);

    // --- Paso 4: SVC-03 ServicioInspeccion → validarEstadoVehiculo ---
    const estado = this.inspeccionService.validarEstadoVehiculo(vehiculo.id);
    pasos.push(`4. Estado técnico validado: ${estado.estado}`);

    if (estado.estado !== 'APROBADO') {
      // El vehículo queda en estado OBSERVADO — pasos 5 y 6 no se ejecutan
      this.vehiculoService.update(vehiculo.id, { estado: 'en_inspeccion' });
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

    // --- Paso 5: SVC-06 ServicioPrecio → calcularPrecioMercado ---
    const precio = this.precioService.calcularPrecio({
      vehiculoId: vehiculo.id,
      precioBase: dto.precio,
      anio: dto.anio,
      marca: dto.marca,
    });
    // Actualizar el precio del vehículo con el calculado
    this.vehiculoService.update(vehiculo.id, { precio: precio.precioCalculado });
    pasos.push(`5. Precio referencial calculado: $${precio.precioCalculado}`);

    // --- Paso 6: SVC-07 ServicioNotificacion → enviarNotificacion ---
    const notificacion = this.notificacionService.enviarNotificacion({
      destinatario: dto.correoNotificacion,
      asunto: `Vehículo registrado — ${vehiculo.marca} ${vehiculo.modelo}`,
      mensaje: `El vehículo ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placa}) ha sido registrado exitosamente. Inspección: ${inspeccion.resultado}. Precio referencial: $${precio.precioCalculado}.`,
      tipo: 'email',
    });
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
