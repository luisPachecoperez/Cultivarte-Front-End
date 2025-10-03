import { Sesiones } from "../../eventos/interfaces/sesiones.interface";

export interface Evento_Sesiones {
  id_programa: string;
  id_actividad: string;
  institucional: string;
  id_tipo_actividad: string;
  id_responsable: string;
  id_aliado: string;
  id_sede: string;
  nombre_actividad: string;
  descripcion: string;
  id_frecuencia: string;
  fecha_actividad: string;
  hora_inicio: string;
  hora_fin: string;

  sesiones: Sesiones[];

  sedes: { id_sede: string; nombre: string }[];
  tiposDeActividad: { id_tipo_actividad: string; nombre: string }[];
  aliados: { id_aliado: string; nombre: string }[];
  responsables: { id_responsable: string; nombre: string }[];
  nombreEventos: { id_parametro_detalle: string; nombre: string }[];
  frecuencias: { id_frecuencia: string; nombre: string }[];
}
