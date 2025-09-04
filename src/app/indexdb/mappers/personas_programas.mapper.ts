import { Personas_programas } from '../interfaces/personas_programas';

export class Personas_programasMapper {
  static toDomain(row: any): Personas_programas {
    return {
      id_personas_programa: row.id_personas_programa,
      id_persona: row.id_persona,
      id_programa: row.id_programa,
      id_creado_por: row.id_creado_por,
      fecha_creacion: row.fecha_creacion,
      id_modificado_por: row.id_modificado_por,
      fecha_modificacion: row.fecha_modificacion
    } as Personas_programas;
  }

  static toPersistence(entity: Personas_programas): any {
    return {
      id_personas_programa: entity.id_personas_programa,
      id_persona: entity.id_persona,
      id_programa: entity.id_programa,
      id_creado_por: entity.id_creado_por,
      fecha_creacion: entity.fecha_creacion,
      id_modificado_por: entity.id_modificado_por,
      fecha_modificacion: entity.fecha_modificacion
    };
  }
}
