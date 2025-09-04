export interface Asistencias {
  id_asistencia: string;
  id_actividad: string;
  id_sesion: string;
  id_persona: string;
  id_creado_por: string;
  fecha_creacion: Date;
  id_modificado_por: string;
  fecha_modificacion: Date;
  syncStatus: string;
  deleted: boolean | null; // Indica si la actividad ha sido eliminada
}
