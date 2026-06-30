/**
 * ServicioPrecio — Servicio de Tarea SOA.
 * Calcula el precio referencial de un vehículo aplicando reglas de negocio.
 * Se expone como verbo: POST /api/v1/calcular-precio
 */

export interface CalculoPrecioDto {
  vehiculoId: string;
  precioBase: number;
  anio: number;
  marca: string;
}

export interface PrecioResultadoDto {
  vehiculoId: string;
  precioBase: number;
  factorDepreciacion: number;  // Porcentaje aplicado por antigüedad
  factorMarca: number;         // Ajuste según demanda de la marca
  precioCalculado: number;     // Precio final sugerido
}

export class PrecioService {
  /** Marcas con mayor demanda reciben un factor premium */
  private static factoresMarca: Record<string, number> = {
    Toyota: 1.05,
    Honda: 1.03,
    Ford: 1.0,
    Chevrolet: 0.98,
    Nissan: 1.02,
  };

  /**
   * Calcula el precio referencial considerando:
   * - Depreciación por antigüedad (2% por año desde el año actual)
   * - Factor de marca según demanda del mercado
   */
  calcularPrecio(dto: CalculoPrecioDto): PrecioResultadoDto {
    const anioActual = new Date().getFullYear();
    const antiguedad = anioActual - dto.anio;

    // 2% de depreciación por año, mínimo 50% del valor
    const factorDepreciacion = Math.max(0.5, 1 - antiguedad * 0.02);

    // Factor de marca: premium para marcas populares, neutro para desconocidas
    const factorMarca = PrecioService.factoresMarca[dto.marca] ?? 1.0;

    const precioCalculado = Math.round(dto.precioBase * factorDepreciacion * factorMarca);

    return {
      vehiculoId: dto.vehiculoId,
      precioBase: dto.precioBase,
      factorDepreciacion,
      factorMarca,
      precioCalculado,
    };
  }
}
