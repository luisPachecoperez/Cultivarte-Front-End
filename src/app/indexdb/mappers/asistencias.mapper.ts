import { Asistencias } from '../interfaces/asistencias';

export class AsistenciasMapper {
  static toDomain(row: any): Asistencias {
    return {
      id_asistencia: row.id_asistencia,
      id_actividad: row.id_actividad,
      id_sesion: row.id_sesion,
      id_persona: row.id_persona,
      id_creado_por: row.id_creado_por,
      fecha_creacion: row.fecha_creacion,
      id_modificado_por: row.id_modificado_por,
      fecha_modificacion: row.fecha_modificacion
    } as Asistencias;
  }

  static toPersistence(entity: Asistencias): any {
    return {
      id_asistencia: entity.id_asistencia,
      id_actividad: entity.id_actividad,
      id_sesion: entity.id_sesion,
      id_persona: entity.id_persona,
      id_creado_por: entity.id_creado_por,
      fecha_creacion: entity.fecha_creacion,
      id_modificado_por: entity.id_modificado_por,
      fecha_modificacion: entity.fecha_modificacion
    };
  }
}
