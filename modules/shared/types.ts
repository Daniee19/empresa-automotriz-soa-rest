/**
 * Tipos compartidos para las respuestas estandarizadas de la API.
 * Todos los endpoints devuelven ApiResponse<T> para mantener un contrato uniforme.
 */

/** Respuesta exitosa — incluye datos tipados y un mensaje descriptivo */
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

/** Respuesta de error — incluye código de error para identificación programática */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode: string;
}

/** Unión discriminada: el campo `success` permite narrowing en el consumidor */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
