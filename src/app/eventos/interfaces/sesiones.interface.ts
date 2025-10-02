export interface Sesiones {
  id_sesion: string;
  id_actividad: string;
  fecha_actividad?: string;
  hora_inicio?: string;
  hora_fin?: string;
  nombre_actividad?: string | null;
  desde?: string | null;
  hasta?: string | null;
  imagen?: string;
  nro_asistentes?: number | 0;
  descripcion?: string | undefined;
  id_creado_por?: string;
  fecha_creacion?: string;
  id_modificado_por?: string | null;
  fecha_modificacion?: string | null;
  [key: string]: any; // Firma de índice para permitir propiedades adicionales
}
