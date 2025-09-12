export interface PreAsistencia {
  id_sesion: string;
  id_sede: string;
  numero_asistentes: number| 0;
  descripcion: string| null;
  foto: string | null;
  imagen: string | null;
  sedes: { id_sede: string; nombre: string }[];
  beneficiarios: { id_persona: string;nombre_completo: string;id_sede: string;}[]|null;
  asistentes_sesiones: ({id_persona: string | null, eliminar: string| null})[]|null ;
}
