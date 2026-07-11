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
 * Comunicación SOA: Todas las llamadas se realizan vía HTTP (axios)
 * a los endpoints REST de cada servicio, pasando por sus controladores.
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

import apiClient from '@/modules/shared/api-client';

/** Datos de entrada para valorizar un vehículo */
export interface ValorizacionDto {
  vehiculoId: string;
  clienteId?: string;
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
  /**
   * Ejecuta la valorización — Patrón Scatter-Gather.
   * Lanza todas las consultas HTTP en paralelo y consolida resultados.
   */
  async valorizar(dto: ValorizacionDto): Promise<ValorizacionResultado> {
    const inicio = Date.now();

    // Scatter: lanzar todas las consultas HTTP en paralelo con timeout
    const [vehiculoRes, precioRes, ventasRes, ofertasRes, crmRes] = await Promise.all([
      // 1. SVC-01 GET /api/v1/vehiculos/{id} → consultarVehiculo
      conTimeout(
        apiClient.get(`/vehiculos/${dto.vehiculoId}`).then(r => r.data.data).catch(() => null),
        TIMEOUT_MS
      ),
      // 2. SVC-06 POST /api/v1/calcular-precio → calcularPrecioMercado
      conTimeout(
        apiClient.get(`/vehiculos/${dto.vehiculoId}`)
          .then(r => r.data.data)
          .then(v => v ? apiClient.post('/calcular-precio', {
            vehiculoId: v.id,
            precioBase: v.precio,
            anio: v.anio,
            marca: v.marca,
          }).then(r => r.data.data) : null)
          .catch(() => null),
        TIMEOUT_MS
      ),
      // 3. SVC-04 GET /api/v1/ventas/historial/{vehiculoId} → consultarHistorialVentas
      conTimeout(
        apiClient.get(`/ventas/historial/${dto.vehiculoId}`).then(r => r.data.data).catch(() => null),
        TIMEOUT_MS
      ),
      // 4. SVC-05 GET /api/v1/subastas/historial/{vehiculoId} → consultarHistorialOfertas
      conTimeout(
        apiClient.get(`/subastas/historial/${dto.vehiculoId}`).then(r => r.data.data).catch(() => null),
        TIMEOUT_MS
      ),
      // 5. SVC-09 GET /api/v1/crm/interacciones/{clienteId} → obtenerInteracciones
      conTimeout(
        dto.clienteId
          ? apiClient.get(`/crm/interacciones/${dto.clienteId}`).then(r => r.data.data).catch(() => null)
          : Promise.resolve(null),
        TIMEOUT_MS
      ),
    ]);

    const tiempoTotalMs = Date.now() - inicio;

    // Gather / Aggregator: consolidar resultados disponibles
    let serviciosDisponibles = 0;
    const serviciosTotales = 5;

    const datosVehiculo = vehiculoRes ? (serviciosDisponibles++, vehiculoRes as Record<string, unknown>) : 'datos no disponibles' as const;
    const precioReferencial = precioRes ? (serviciosDisponibles++, precioRes as Record<string, unknown>) : 'datos no disponibles' as const;
    const historialVentas = ventasRes ? (serviciosDisponibles++, ventasRes as Record<string, unknown>[]) : 'datos no disponibles' as const;
    const historialOfertas = ofertasRes ? (serviciosDisponibles++, ofertasRes as Record<string, unknown>[]) : 'datos no disponibles' as const;
    const interesCliente = crmRes ? (serviciosDisponibles++, crmRes as Record<string, unknown>) : 'datos no disponibles' as const;

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
