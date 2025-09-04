import { Personas_sedes } from '../interfaces/personas_sedes';

export class Personas_sedesMapper {
  static toDomain(row: any): Personas_sedes {
    return {
      id_personas_sede: row.id_personas_sede,
      id_persona: row.id_persona,
      id_sede: row.id_sede,
      id_creado_por: row.id_creado_por,
      fecha_creacion: row.fecha_creacion,
      id_modificado_por: row.id_modificado_por,
      fecha_modificacion: row.fecha_modificacion
    } as Personas_sedes;
  }

  static toPersistence(entity: Personas_sedes): any {
    return {
      id_personas_sede: entity.id_personas_sede,
      id_persona: entity.id_persona,
      id_sede: entity.id_sede,
      id_creado_por: entity.id_creado_por,
      fecha_creacion: entity.fecha_creacion,
      id_modificado_por: entity.id_modificado_por,
      fecha_modificacion: entity.fecha_modificacion
    };
  }
}
