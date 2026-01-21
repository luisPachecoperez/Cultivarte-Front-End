import { Sesiones } from './sesiones.interface';
export interface EventoSeleccionado {
  id_programa?: string;
  institucional?: boolean | string;
  id_actividad?: string;
  id_tipo_actividad?: string;
  id_responsable?: string;
  id_aliado?: string;
  nombre_actividad?: string | null;
  id_sede?: string;
  descripcion?: string | null;
  id_frecuencia?: string;
  fecha_actividad?: string | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  nro_asistentes?: number | null;
  sesiones?: Sesiones[];
  id_sesion?: string;
}
