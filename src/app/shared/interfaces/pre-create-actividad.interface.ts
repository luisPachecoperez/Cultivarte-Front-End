export interface PreCreateActividad {
  id_programa: string;
  sedes: { id_sede: string; nombre: string }[];
  tiposDeActividad: { id_tipo_actividad: string; nombre: string }[];
  aliados: { id_aliado: string; nombre: string }[];
  responsables: { id_responsable: string; nombre: string }[];
  nombreDeActividades: { id_tipo_actividad: string; nombre: string }[];
  frecuencias: { id_frecuencia: string; nombre: string }[];

}
