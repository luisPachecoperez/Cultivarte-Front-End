import { Sesiones } from '../interfaces/sesiones';

export class SesionesMapper {
  static toDomain(row: any): Sesiones {
    return {
      id_sesion: row.id_sesion,
      id_actividad: row.id_actividad,
      fecha_actividad: row.fecha_actividad,
      hora_inicio: row.hora_inicio,
      hora_fin: row.hora_fin,
      imagen: row.imagen,
      nro_asistentes: row.nro_asistentes,
      id_creado_por: row.id_creado_por,
      fecha_creacion: row.fecha_creacion,
      id_modificado_por: row.id_modificado_por,
      fecha_modificacion: row.fecha_modificacion
    } as Sesiones;
  }

  static toPersistence(entity: Sesiones): any {
    return {
      id_sesion: entity.id_sesion,
      id_actividad: entity.id_actividad,
      fecha_actividad: entity.fecha_actividad,
      hora_inicio: entity.hora_inicio,
      hora_fin: entity.hora_fin,
      imagen: entity.imagen,
      nro_asistentes: entity.nro_asistentes,
      id_creado_por: entity.id_creado_por,
      fecha_creacion: entity.fecha_creacion,
      id_modificado_por: entity.id_modificado_por,
      fecha_modificacion: entity.fecha_modificacion
    };
  }
}
