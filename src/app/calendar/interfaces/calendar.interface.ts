import { EventInput } from '@fullcalendar/core';

// Representa el objeto recibido al abrir edición
export interface EventoCalendarioWrapper {
  event: EventInput;
}

// Payload que recibes desde el formulario de evento
export interface EventoFormPayload {
  sesiones: SesionCalendario[];
  editarUna?: boolean;
  idSesionOriginal?: string;
}

// Representa una sesión dentro de un evento
export interface SesionCalendario {
  id?: string;           // id único de la sesión
  nombreSesion?: string; // título o nombre de la sesión
  fecha: string;        // formato YYYY-MM-DD
  horaInicio: string;   // formato HH:mm
  horaFin: string;      // formato HH:mm
  id_actividad?: string;
  id_sesion?: string;
  asistentes_evento?: number;
  tipo_evento?: string;
}

export interface SesionBackendDTO {
  id_sesion: string;
  id_actividad: string;
  fecha_sesion: Date;
  hora_inicio: string;
  hora_fin: string;
  nombre_actividad: string | null;
  desde: string | null;
  hasta: string | null;
  imagen: string;
  asistentes_evento: number;
  syncStatus: string | null;
  deleted: boolean | null;
}

export interface EventoCalendario {
  id: string;
  title: string | null;
  start: string | null;
  end: string | null;
  extendedProps: SesionCalendario;  // 👈 lo que devuelve el servicio
}


// Estructura del evento seleccionado en modales
export interface EventoSeleccionado {
  id_actividad: string;
  id_sesion: string;
  asistentes_evento?: number;
  tipo_evento?: string;
  nombreSesion: string;
  sesiones: SesionCalendario[];
  fecha: string;
  horaInicio: string;
  horaFin: string;
}
