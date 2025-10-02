import { Responsables } from './lista-responsables-interface';
import { Frecuencias } from './lista-frecuencias-interface';
import { TiposDeActividad } from './lista-tipos-actividades-interface';
import { NombresDeActividad } from './lista-nombres-actividades.interface';
import { Sedes } from './lista-sedes.interface';
import { Aliados } from './lista-aliados.interface';
export interface PreCreateActividad {
  id_programa: string;
  sedes: Sedes[];
  tiposDeActividad: TiposDeActividad[];
  aliados: Aliados[];
  responsables: Responsables[];
  nombresDeActividad: NombresDeActividad[];
  frecuencias: Frecuencias[];
}
