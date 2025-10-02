export interface Asistencias {
  id_asistencia: string;
  id_actividad?: string;
  id_sesion: string;
  id_persona: string;
  id_creado_por?: string | null;
  fecha_creacion?: Date | null;
  id_modificado_por?: string | null;
  fecha_modificacion?: Date | null;
  eliminar?: string | null;
}
