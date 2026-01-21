export interface Actividades {
  id_actividad: string;
  id_programa?: string;
  id_tipo_actividad?: string;
  id_responsable?: string;
  id_aliado?: string;
  id_sede?: string;
  id_frecuencia?: string;
  institucional?: string;
  nombre_actividad?: string | null;
  asistentes_evento?: number;
  descripcion?: string | null;
  fecha_actividad?: string | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  plazo_asistencia?: string | null;
  estado?: string;
  id_creado_por?: string | null;
  fecha_creacion?: string | null;
  id_modificado_por?: string | null;
  fecha_modificacion?: string | null;
}
