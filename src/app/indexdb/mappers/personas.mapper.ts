import { Personas } from '../interfaces/personas';

export class PersonasMapper {
  static toDomain(row: any): Personas {
    return {
      id_persona: row.id_persona,
      id_tipo_persona: row.id_tipo_persona,
      id_colegio: row.id_colegio,
      id_sexo: row.id_sexo,
      id_ubicacion: row.id_ubicacion,
      id_pais: row.id_pais,
      id_departamento: row.id_departamento,
      id_ciudad: row.id_ciudad,
      id_tipo_identificacion: row.id_tipo_identificacion,
      identificacion: row.identificacion,
      nombres: row.nombres,
      apellidos: row.apellidos,
      razon_social: row.razon_social,
      fecha_nacimiento: row.fecha_nacimiento,
      nombre_acudiente: row.nombre_acudiente,
      apellidos_acudiente: row.apellidos_acudiente,
      correo_acudiente: row.correo_acudiente,
      celular_acudiente: row.celular_acudiente,
      archivo_habeas_data: row.archivo_habeas_data,
      acepta_habeas_data: row.acepta_habeas_data,
      fecha_habeas_data: row.fecha_habeas_data,
      canal_habeas_data: row.canal_habeas_data,
      soporte_habeas_data: row.soporte_habeas_data,
      dir_ip_habeas_data: row.dir_ip_habeas_data,
      email: row.email,
      email_contacto: row.email_contacto,
      telefono_movil_contacto: row.telefono_movil_contacto,
      telefono_movil: row.telefono_movil,
      eliminado: row.eliminado,
      id_creado_por: row.id_creado_por,
      fecha_creacion: row.fecha_creacion,
      id_modificado_por: row.id_modificado_por,
      fecha_modificacion: row.fecha_modificacion
    } as Personas;
  }

  static toPersistence(entity: Personas): any {
    return {
      id_persona: entity.id_persona,
      id_tipo_persona: entity.id_tipo_persona,
      id_colegio: entity.id_colegio,
      id_sexo: entity.id_sexo,
      id_ubicacion: entity.id_ubicacion,
      id_pais: entity.id_pais,
      id_departamento: entity.id_departamento,
      id_ciudad: entity.id_ciudad,
      id_tipo_identificacion: entity.id_tipo_identificacion,
      identificacion: entity.identificacion,
      nombres: entity.nombres,
      apellidos: entity.apellidos,
      razon_social: entity.razon_social,
      fecha_nacimiento: entity.fecha_nacimiento,
      nombre_acudiente: entity.nombre_acudiente,
      apellidos_acudiente: entity.apellidos_acudiente,
      correo_acudiente: entity.correo_acudiente,
      celular_acudiente: entity.celular_acudiente,
      archivo_habeas_data: entity.archivo_habeas_data,
      acepta_habeas_data: entity.acepta_habeas_data,
      fecha_habeas_data: entity.fecha_habeas_data,
      canal_habeas_data: entity.canal_habeas_data,
      soporte_habeas_data: entity.soporte_habeas_data,
      dir_ip_habeas_data: entity.dir_ip_habeas_data,
      email: entity.email,
      email_contacto: entity.email_contacto,
      telefono_movil_contacto: entity.telefono_movil_contacto,
      telefono_movil: entity.telefono_movil,
      eliminado: entity.eliminado,
      id_creado_por: entity.id_creado_por,
      fecha_creacion: entity.fecha_creacion,
      id_modificado_por: entity.id_modificado_por,
      fecha_modificacion: entity.fecha_modificacion
    };
  }
}
