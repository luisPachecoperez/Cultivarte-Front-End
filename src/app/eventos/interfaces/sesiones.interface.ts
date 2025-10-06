export interface Sesiones {
  id_sesion: string;
  id_actividad: string;
  fecha_actividad?: string | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  nombre_actividad?: string | null;
  desde?: string | null;
  hasta?: string | null;
  imagen?: string | null;
  nro_asistentes?: number | null; // 💡 limpio, sin |undefined
  descripcion?: string | null;
  id_creado_por?: string;
  fecha_creacion?: string;
  id_modificado_por?: string | null;
  fecha_modificacion?: string | null;
  [key: string]: any; // Firma de índice
}



/*export interface Sesiones {
  id_sesion: string;
  id_actividad: string;
  fecha_actividad?: string|null;
  hora_inicio?: string|null;
  hora_fin?: string|null;
  nombre_actividad?: string | null;
  desde?: string | null;
  hasta?: string | null;
  imagen?: string|null;
  nro_asistentes?: number |null;
  descripcion?: string | null;
  id_creado_por?: string;
  fecha_creacion?: string;
  id_modificado_por?: string | null;
  fecha_modificacion?: string | null;
  [key: string]: any; // Firma de índice para permitir propiedades adicionales
}
*/