export interface Sesiones {
   id_sesion: string;
   id_actividad: string;
   fecha_sesion: Date;
   hora_inicio: any;
   hora_fin: any;
   nombre_actividad: string| null;
   desde : string | null;
   hasta : string | null;
   imagen: string;
   asistentes_evento: number;
   syncStatus: string |null;
   deleted: boolean | null; // Indica si la sesión ha sido eliminada
}
