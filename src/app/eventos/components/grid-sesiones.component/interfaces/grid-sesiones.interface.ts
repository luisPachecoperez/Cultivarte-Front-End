// src/app/eventos/components/grid-sesiones.component/interfaces/grid-sesiones.interface.ts

// Estado interno de la sesión
export type EstadoSesion = 'original' | 'nuevo' | 'modificado';

// Lo que maneja el formulario (FormGroup)
export interface SesionFormValue {
  id_actividad?: string | null;
  id_sesion: string;
  fecha: string;       // YYYY-MM-DD
  horaInicio: string;  // HH:mm
  horaFin: string;     // HH:mm
  asistentes_sesion: number;
  metaEstado: EstadoSesion;
}

// Lo que se envía al backend
export interface SesionDTOGrid {
  id_actividad?: string | null;
  id_sesion?: string;
  fecha_sesion: string;
  hora_inicio: string;
  hora_fin: string;
}
