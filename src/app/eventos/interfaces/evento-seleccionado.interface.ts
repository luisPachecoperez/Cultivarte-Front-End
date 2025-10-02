import { Sesiones } from './sesiones.interface';
export interface EventoSeleccionado {
  id_programa?: string;
  institucional?: boolean | string;
  id_actividad?: string; // forzamos string (no opcional)
  id_tipo_actividad?: string;
  id_responsable?: string;
  id_aliado?: string;
  nombre_actividad?: string;
  id_sede?: string;
  descripcion?: string;
  id_frecuencia?: string;
  fecha_actividad?: string;
  hora_inicio?: string;
  hora_fin?: string;
  nro_asistentes?: number;
  sesiones?: Sesiones[]; // siempre array
  id_sesion?: string;
}
