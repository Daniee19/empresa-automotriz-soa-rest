/**
 * Cliente HTTP compartido (axios) para comunicación entre servicios SOA.
 * Los orquestadores usan este cliente para llamar a los endpoints REST
 * de cada servicio en lugar de importar sus clases directamente.
 */

import axios from 'axios';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export default apiClient;
