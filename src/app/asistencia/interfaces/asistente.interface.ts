/*Interface que recibe la informacion de asistentes previos, 
si eliminar es 'S', indica que es una sesion donde los asitentes son los 
asistentes de sesiones previas y se pueden eliminar, de lo contrario son
los asistentes ya confirmados, no se pueden eliminar*/
export interface Asistente {
  id_persona: string;
  nombre_completo?: string;
  id_sede?: string | null;
  eliminar?: string;
  identificacion?: string | null;
}
