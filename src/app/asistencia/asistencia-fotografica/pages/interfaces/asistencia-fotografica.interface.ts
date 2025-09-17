// src/app/asistencia/asistencia-fotografica/models/asistencia-fotografica.ts

/**
 * 📥 Evento que llega desde el calendario al abrir el modal
 */
export interface EventoAsistencia {
  id_actividad: string;
  id_sesion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  nombreSesion: string;
}

/**
 * 📥 Detalle de asistencia devuelto por el backend
 */
export interface DetalleAsistencia {
  sedes: { id_sede: string; nombre: string }[];
  imagen?: string;
  descripcion?: string;
  numero_asistentes?: number;
}

/**
 * 📤 Payload que se envía al guardar asistencia fotográfica
 */
export interface PayloadAsistencia {
  id_actividad: string;
  id_sesion: string;
  imagen: string;
  numero_asistentes: number;
  descripcion: string;
  nuevos: unknown[];
}

/**
 * 📤 Respuesta del backend al guardar asistencia fotográfica
 */
export interface AsistenciaResponse {
  exitoso: string;
  mensaje?: string;
}
