import { Personas_grupo_interes } from '../interfaces/personas_grupo_interes';

export class Personas_grupo_interesMapper {
  static toDomain(row: any): Personas_grupo_interes {
    return {
      id_personas_grupo_interes: row.id_personas_grupo_interes,
      id_persona: row.id_persona,
      id_grupo_interes: row.id_grupo_interes,
      id_creado_por: row.id_creado_por,
      fecha_creacion: row.fecha_creacion,
      id_modificado_por: row.id_modificado_por,
      fecha_modificacion: row.fecha_modificacion
    } as Personas_grupo_interes;
  }

  static toPersistence(entity: Personas_grupo_interes): any {
    return {
      id_personas_grupo_interes: entity.id_personas_grupo_interes,
      id_persona: entity.id_persona,
      id_grupo_interes: entity.id_grupo_interes,
      id_creado_por: entity.id_creado_por,
      fecha_creacion: entity.fecha_creacion,
      id_modificado_por: entity.id_modificado_por,
      fecha_modificacion: entity.fecha_modificacion
    };
  }
}
