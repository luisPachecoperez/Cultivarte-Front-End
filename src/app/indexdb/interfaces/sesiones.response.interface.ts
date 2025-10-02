export interface SesionesResponseDB {
  id_sesion: string;
  id_actividad: string;
  fecha_actividad: string;
  hora_inicio: string;
  hora_fin: string;
  nombre_actividad?: string | null;
  desde?: string | null;
  hasta?: string | null;
  imagen?: string;
  nro_asistentes?: number | null;
  descripcion?: string | null;
  id_creado_por?: string;
  fecha_creacion?: string;
  id_modificado_por?: string | null;
  fecha_modificacion?: string | null;
  syncStatus: string;
  deleted: boolean; // Indica si la sesión ha sido eliminada
}
