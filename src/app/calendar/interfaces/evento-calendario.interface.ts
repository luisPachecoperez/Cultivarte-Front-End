export interface EventoCalendario {
  id_actividad: string;
  id_sesion: string;
  title?: string; // siempre string (mapear con fallback '')
  start?: string; // ISO string 'YYYY-MM-DDTHH:mm' (siempre string)
  end?: string; // ISO string
  extendedProps: {
    id_actividad?: string;
    id_sesion?: string;
    asistentes_evento?: number;
    desde?: string;
    hasta?: string;
    nombre_actividad?: string;
  };
}
