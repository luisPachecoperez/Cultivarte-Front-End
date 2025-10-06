import { Sesiones } from '../../eventos/interfaces/sesiones.interface';

export interface ActividadSesiones {
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
  fecha_actividad: Date | string;
  hora_inicio: string | null;
  hora_fin: string | null;

  sesiones: Sesiones[];

  sedes: {
    id_sede: string;
    nombre: string;
  }[];

  tiposDeActividad: {
    id_parametro_detalle: string;
    nombre: string;
  }[];

  aliados: {
    id_aliado: string;
    nombre: string; // se puede armar con nombres + apellidos o razón social
  }[];

  responsables: {
    id_parametro_detalle: string;
    nombre: string;
  }[];

  nombreEventos: {
    id_parametro_detalle: string;
    nombre: string;
  }[];

  frecuencias: {
    id_parametro_detalle: string;
    nombre: string;
  }[];
}
