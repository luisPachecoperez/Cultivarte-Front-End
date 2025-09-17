// calendar-backend.interface.ts
export interface SesionBackendDTO {
  id_sesion: string;
  id_actividad: string;
  fecha_sesion: Date;
  hora_inicio: string;
  hora_fin: string;
  nombre_actividad: string | null;
  desde: string | null;
  hasta: string | null;
  imagen: string;
  asistentes_evento: number;
  syncStatus: string | null;
  deleted: boolean | null;
}
