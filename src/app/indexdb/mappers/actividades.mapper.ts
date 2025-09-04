import { Actividades } from '../interfaces/actividades';

export class ActividadesMapper {
  static toDomain(row: any): Actividades {
    return {
      id_actividad: row.id_actividad,
      id_programa: row.id_programa,
      id_tipo_actividad: row.id_tipo_actividad,
      id_responsable: row.id_responsable,
      id_aliado: row.id_aliado,
      id_sede: row.id_sede,
      id_frecuencia: row.id_frecuencia,
      institucional: row.institucional,
      nombre_actividad: row.nombre_actividad,
      descripcion: row.descripcion,
      fecha_actividad_desde: row.fecha_actividad_desde,
      fecha_actividad_hasta: row.fecha_actividad_hasta,
      plazo_asistencia: row.plazo_asistencia,
      estado: row.estado,
      id_creado_por: row.id_creado_por,
      fecha_creacion: row.fecha_creacion,
      id_modificado_por: row.id_modificado_por,
      fecha_modificacion: row.fecha_modificacion
    } as Actividades;
  }

  static toPersistence(entity: Actividades): any {
    return {
      id_actividad: entity.id_actividad,
      id_programa: entity.id_programa,
      id_tipo_actividad: entity.id_tipo_actividad,
      id_responsable: entity.id_responsable,
      id_aliado: entity.id_aliado,
      id_sede: entity.id_sede,
      id_frecuencia: entity.id_frecuencia,
      institucional: entity.institucional,
      nombre_actividad: entity.nombre_actividad,
      descripcion: entity.descripcion,
      fecha_actividad_desde: entity.fecha_actividad_desde,
      fecha_actividad_hasta: entity.fecha_actividad_hasta,
      plazo_asistencia: entity.plazo_asistencia,
      estado: entity.estado,
      id_creado_por: entity.id_creado_por,
      fecha_creacion: entity.fecha_creacion,
      id_modificado_por: entity.id_modificado_por,
      fecha_modificacion: entity.fecha_modificacion
    };
  }
}
