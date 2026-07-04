/**
 * FlujoValorizacionVehicular — Servicio de Tarea SOA (Compositor / Orquestador).
 *
 * Composición — Valorización Vehicular Inteligente
 * Patrón: Scatter-Gather + Aggregator
 * Tipo de invocación: Paralela — múltiples fuentes son consultadas simultáneamente
 * Trigger: Ejecución programada diaria para actualización de precios
 *
 * Flujo de orquestación (paralelo):
 *   1. SVC-01 ServicioVehiculo         → consultarVehiculo(idVehiculo)         [400ms max]
 *   2. SVC-06 ServicioPrecio           → calcularPrecioMercado(idVehiculo)     [700ms max]
 *   3. SVC-04 ServicioVenta            → consultarHistorialVentas(idVehiculo)  [500ms max]
 *   4. SVC-05 ServicioSubasta          → consultarHistorialOfertas(idVehiculo) [500ms max]
 *   5. SVC-09 ServicioIntegracionCRM   → obtenerInteracciones(idCliente)       [600ms max]
 *
 * Resultado consolidado:
 *   ValorizacionVehiculo { datosVehiculo, precioReferencial, historialVentas,
 *                          historialOfertas, interesCliente }
 *   Tiempo total: max(400,700,500,500,600) = ~700ms
 *
 * Comportamiento ante error:
 *   Si uno de los servicios supera 1,500ms o no responde, el Aggregator
 *   consolida la información disponible y retorna el campo afectado como
 *   "datos no disponibles", evitando bloquear el proceso completo.
 */

import { VehiculoService } from '@/modules/vehiculo/services/vehiculo.service';
import { PrecioService } from '@/modules/precio/services/precio.service';
import { VentaService } from '@/modules/venta/services/venta.service';
import { SubastaService } from '@/modules/subasta/services/subasta.service';
import { IntegracionCRMService } from '@/modules/integracion-crm/services/integracion-crm.service';

/** Datos de entrada para valorizar un vehículo */
export interface ValorizacionDto {
  vehiculoId: string;
  clienteId?: string; // Opcional — si se provee, consulta interés en CRM
}

/** Resultado consolidado de la valorización */
export interface ValorizacionResultado {
  vehiculoId: string;
  datosVehiculo: Record<string, unknown> | 'datos no disponibles';
  precioReferencial: Record<string, unknown> | 'datos no disponibles';
  historialVentas: Record<string, unknown>[] | 'datos no disponibles';
  historialOfertas: Record<string, unknown>[] | 'datos no disponibles';
  interesCliente: Record<string, unknown> | 'datos no disponibles';
  tiempoTotalMs: number;
  serviciosDisponibles: number;
  serviciosTotales: number;
}

const TIMEOUT_MS = 1500;

/** Ejecuta una promesa con timeout — retorna null si excede el límite */
function conTimeout<T>(promesa: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promesa,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export class ValorizacionService {
  private vehiculoService = new VehiculoService();
  private precioService = new PrecioService();
  private ventaService = new VentaService();
  private subastaService = new SubastaService();
  private crmService = new IntegracionCRMService();

  /**
   * Ejecuta la valorización — Patrón Scatter-Gather.
   * Lanza todas las consultas en paralelo y consolida resultados.
   */
  async valorizar(dto: ValorizacionDto): Promise<ValorizacionResultado> {
    const inicio = Date.now();

    // Scatter: lanzar todas las consultas en paralelo con timeout
    const [vehiculo, precio, ventas, ofertas, crm] = await Promise.all([
      // 1. SVC-01 ServicioVehiculo → consultarVehiculo
      conTimeout(Promise.resolve(this.vehiculoService.findById(dto.vehiculoId)), TIMEOUT_MS),
      // 2. SVC-06 ServicioPrecio → calcularPrecioMercado
      conTimeout(
        Promise.resolve(
          (() => {
            const v = this.vehiculoService.findById(dto.vehiculoId);
            if (!v) return null;
            return this.precioService.calcularPrecio({
              vehiculoId: v.id,
              precioBase: v.precio,
              anio: v.anio,
              marca: v.marca,
            });
          })()
        ),
        TIMEOUT_MS
      ),
      // 3. SVC-04 ServicioVenta → consultarHistorialVentas
      conTimeout(Promise.resolve(this.ventaService.consultarHistorialVentas(dto.vehiculoId)), TIMEOUT_MS),
      // 4. SVC-05 ServicioSubasta → consultarHistorialOfertas
      conTimeout(Promise.resolve(this.subastaService.consultarHistorialOfertas(dto.vehiculoId)), TIMEOUT_MS),
      // 5. SVC-09 ServicioIntegracionCRM → obtenerInteracciones
      conTimeout(
        Promise.resolve(dto.clienteId ? this.crmService.obtenerInteracciones(dto.clienteId) : null),
        TIMEOUT_MS
      ),
    ]);

    const tiempoTotalMs = Date.now() - inicio;

    // Gather / Aggregator: consolidar resultados disponibles
    let serviciosDisponibles = 0;
    const serviciosTotales = 5;

    const datosVehiculo = vehiculo ? (serviciosDisponibles++, vehiculo as unknown as Record<string, unknown>) : 'datos no disponibles' as const;
    const precioReferencial = precio ? (serviciosDisponibles++, precio as unknown as Record<string, unknown>) : 'datos no disponibles' as const;
    const historialVentas = ventas ? (serviciosDisponibles++, ventas as unknown as Record<string, unknown>[]) : 'datos no disponibles' as const;
    const historialOfertas = ofertas ? (serviciosDisponibles++, ofertas as unknown as Record<string, unknown>[]) : 'datos no disponibles' as const;
    const interesCliente = crm ? (serviciosDisponibles++, crm as unknown as Record<string, unknown>) : 'datos no disponibles' as const;

    return {
      vehiculoId: dto.vehiculoId,
      datosVehiculo,
      precioReferencial,
      historialVentas,
      historialOfertas,
      interesCliente,
      tiempoTotalMs,
      serviciosDisponibles,
      serviciosTotales,
    };
  }
}
