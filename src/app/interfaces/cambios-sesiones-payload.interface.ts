// Update the import path to the correct location of sesiones.interface.ts
import { Sesiones } from '../eventos/interfaces/sesiones.interface';

export interface CambiosSesionesPayload {
  nuevos: Sesiones[];
  modificados: Sesiones[];
  eliminados: Sesiones[];
}
