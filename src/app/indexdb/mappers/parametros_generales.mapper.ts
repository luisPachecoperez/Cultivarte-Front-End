import { Parametros_generales } from '../interfaces/parametros_generales';

export class Parametros_generalesMapper {
  static toDomain(row: any): Parametros_generales {
    return {
      id_parametro_general: row.id_parametro_general,
      nombre_parametro: row.nombre_parametro,
      descripcion: row.descripcion,
      estado: row.estado,
      id_creado_por: row.id_creado_por,
      fecha_creacion: row.fecha_creacion,
      id_modificado_por: row.id_modificado_por,
      fecha_modificacion: row.fecha_modificacion
    } as Parametros_generales;
  }

  static toPersistence(entity: Parametros_generales): any {
    return {
      id_parametro_general: entity.id_parametro_general,
      nombre_parametro: entity.nombre_parametro,
      descripcion: entity.descripcion,
      estado: entity.estado,
      id_creado_por: entity.id_creado_por,
      fecha_creacion: entity.fecha_creacion,
      id_modificado_por: entity.id_modificado_por,
      fecha_modificacion: entity.fecha_modificacion
    };
  }
}
