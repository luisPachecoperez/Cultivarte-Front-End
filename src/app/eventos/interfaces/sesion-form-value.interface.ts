type EstadoSesion = 'original' | 'nuevo' | 'modificado';

export interface SesionFormValue {
  id_actividad?: string | null;
  id_sesion?: string | null;
  fecha_actividad: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  nro_asistentes?: number;
  metaEstado?: EstadoSesion;
}
