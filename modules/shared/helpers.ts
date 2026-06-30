/**
 * Funciones utilitarias para construir respuestas HTTP estandarizadas.
 * Evitan repetir la estructura { success, message, data } en cada controlador.
 */

import { ApiSuccessResponse, ApiErrorResponse } from './types';

/** Construye el objeto de respuesta exitosa con datos genéricos */
export function successResponse<T>(data: T, message: string = 'Operación exitosa'): ApiSuccessResponse<T> {
  return { success: true, message, data };
}

/** Construye el objeto de respuesta de error con código identificador */
export function errorResponse(message: string, errorCode: string): ApiErrorResponse {
  return { success: false, message, errorCode };
}

/** Envuelve cualquier cuerpo en un Response JSON con status HTTP */
export function jsonResponse<T>(body: T, status: number = 200): Response {
  return Response.json(body, { status });
}

/** Parsea el body de un Request como JSON tipado */
export function parseBody<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}
