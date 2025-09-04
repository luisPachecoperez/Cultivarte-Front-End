import { Parametros_detalle } from '../interfaces/parametros_detalle';

export class Parametros_detalleMapper {
  static toDomain(row: any): Parametros_detalle {
    return {
      id_parametro_detalle: row.id_parametro_detalle,
      id_parametro_general: row.id_parametro_general,
      nombre: row.nombre,
      codigo: row.codigo,
      orden: row.orden,
      valores: row.valores,
      estado: row.estado,
      id_creado_por: row.id_creado_por,
      fecha_creacion: row.fecha_creacion,
      id_modificado_por: row.id_modificado_por,
      fecha_modificacion: row.fecha_modificacion
    } as Parametros_detalle;
  }

  static toPersistence(entity: Parametros_detalle): any {
    return {
      id_parametro_detalle: entity.id_parametro_detalle,
      id_parametro_general: entity.id_parametro_general,
      nombre: entity.nombre,
      codigo: entity.codigo,
      orden: entity.orden,
      valores: entity.valores,
      estado: entity.estado,
      id_creado_por: entity.id_creado_por,
      fecha_creacion: entity.fecha_creacion,
      id_modificado_por: entity.id_modificado_por,
      fecha_modificacion: entity.fecha_modificacion
    };
  }
}
