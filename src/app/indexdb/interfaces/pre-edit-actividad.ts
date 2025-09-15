export interface PreEditActividad {
  id_programa: string;
  sedes: { id_sede: string; nombre: string }[];
  tiposDeActividad: { id_tipo_actividad: string; nombre: string }[];
  aliados: { id_aliado: string; nombre: string }[];
  responsables: { id_responsable: string; nombre: string }[];
  nombreDeActividades: { id_tipo_actividad: string; nombre: string }[];
  frecuencias: { id_frecuencia: string; nombre: string }[];

  actividad: {
    id_actividad: string;
    id_programa: string;
    id_tipo_actividad: string;
    id_responsable: string;
    id_aliado: string;
    id_sede: string;
    id_frecuencia: string;
    institucional: 'S' | 'N'; //
    nombre_actividad: string;
    descripcion: string;
    fecha_actividad: string; // formato "YYYY-MM-DD"
    hora_inicio: string;     // formato "HH:mm:ss"
    hora_fin: string;        // formato "HH:mm:ss"
    plazo_asistencia: string | null; // puede ser fecha o null
    estado: string;          // probablemente 'A' = activo
    id_creado_por: string;
    fecha_creacion: string;  // formato "YYYY-MM-DD"
    id_modificado_por: string | null;
    fecha_modificacion: string | null;
  };

  sesiones: {
    id_sesion: string;
    fecha_actividad: string;  // formato "YYYY-MM-DD"
    hora_inicio: string;      // formato "HH:mm:ss"
    hora_fin: string;         // formato "HH:mm:ss"
    nro_asistentes: number;
    id_creado_por: string;
    fecha_creacion: string;   // formato "YYYY-MM-DD"
    id_modificado_por: string | null;
    fecha_modificacion: string | null;
  }[];
}
