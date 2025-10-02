export interface AsistenciaPayLoad {
  id_asistencia?: string;
  id_actividad?: string | null;
  id_sesion?: string;
  imagen?: string | null;
  nro_asistentes?: number;
  descripcion?: string;
  nuevos:
    | {
        id_persona: string;
        id_sesion: string;
        id_asistencia: string;
      }[]
    | [];
}
