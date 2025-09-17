export interface EventoModal {
  id_actividad: string;
  id_sesion?: string;
  nombreSesion: string;

  // 👇 necesarias para el template
  fecha: string;        // YYYY-MM-DD
  horaInicio: string;   // HH:mm
  horaFin: string;      // HH:mm

  asistentes_evento?: number;
}
