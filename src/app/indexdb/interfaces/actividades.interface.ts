import { Time } from "@angular/common";

export interface Actividades {
   id_actividad: string;
   id_programa: string;
   id_tipo_actividad: string;
   id_responsable: string;
   id_aliado: string;
   id_sede: string;
   id_frecuencia: string;
   institucional: string;
   nombre_actividad: string;
   descripcion: string;
   fecha_actividad: string;
   hora_inicio:string | null;
   hora_fin:string | null;
   plazo_asistencia?: Date | null;  // 👈 ahora puede faltar o ser null
   estado: string;
   id_creado_por: string| null;
   fecha_creacion?: string | null;
   id_modificado_por: string|null;
   fecha_modificacion?: string | null;
   syncStatus: string;
   deleted:boolean | null; // Indica si la actividad ha sido eliminada
}
