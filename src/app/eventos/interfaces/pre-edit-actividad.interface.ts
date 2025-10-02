import { Actividades } from './actividades.interface';
import { Sesiones } from './sesiones.interface';
import { Responsables } from './lista-responsables-interface';
import { Frecuencias } from './lista-frecuencias-interface';
import { TiposDeActividad } from './lista-tipos-actividades-interface';
import { NombresDeActividad } from './lista-nombres-actividades.interface';
import { Sedes } from './lista-sedes.interface';
export interface PreEditActividad {
  id_programa: string;
  sedes: Sedes[];
  tiposDeActividad: TiposDeActividad[];
  aliados: { id_aliado: string; nombre: string }[];
  responsables: Responsables[];
  nombresDeActividad: NombresDeActividad[];
  frecuencias: Frecuencias[];

  actividad: Actividades;
  sesiones: Sesiones[];
}
