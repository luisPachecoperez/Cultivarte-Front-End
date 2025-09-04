import { Sedes } from '../interfaces/sedes';

export class SedesMapper {
  static toDomain(row: any): Sedes {
    return {
      id_sede: row.id_sede,
      id_pais: row.id_pais,
      id_departamento: row.id_departamento,
      id_ciudad: row.id_ciudad,
      id_regional_davivienda: row.id_regional_davivienda,
      id_regional_seguros_bolivar: row.id_regional_seguros_bolivar,
      id_tipo_inmueble: row.id_tipo_inmueble,
      id_espacio: row.id_espacio,
      id_uso_inmueble: row.id_uso_inmueble,
      id_nivel_inmueble: row.id_nivel_inmueble,
      id_condicion_urbana: row.id_condicion_urbana,
      id_clima: row.id_clima,
      id_condicion_inmueble: row.id_condicion_inmueble,
      nombre: row.nombre,
      numero_convenio: row.numero_convenio,
      fecha_apertura_sede: row.fecha_apertura_sede,
      matricula_inmobiliaria: row.matricula_inmobiliaria,
      id_creado_por: row.id_creado_por,
      fecha_creacion: row.fecha_creacion,
      id_modificado_por: row.id_modificado_por,
      fecha_modificacion: row.fecha_modificacion
    } as Sedes;
  }

  static toPersistence(entity: Sedes): any {
    return {
      id_sede: entity.id_sede,
      id_pais: entity.id_pais,
      id_departamento: entity.id_departamento,
      id_ciudad: entity.id_ciudad,
      id_regional_davivienda: entity.id_regional_davivienda,
      id_regional_seguros_bolivar: entity.id_regional_seguros_bolivar,
      id_tipo_inmueble: entity.id_tipo_inmueble,
      id_espacio: entity.id_espacio,
      id_uso_inmueble: entity.id_uso_inmueble,
      id_nivel_inmueble: entity.id_nivel_inmueble,
      id_condicion_urbana: entity.id_condicion_urbana,
      id_clima: entity.id_clima,
      id_condicion_inmueble: entity.id_condicion_inmueble,
      nombre: entity.nombre,
      numero_convenio: entity.numero_convenio,
      fecha_apertura_sede: entity.fecha_apertura_sede,
      matricula_inmobiliaria: entity.matricula_inmobiliaria,
      id_creado_por: entity.id_creado_por,
      fecha_creacion: entity.fecha_creacion,
      id_modificado_por: entity.id_modificado_por,
      fecha_modificacion: entity.fecha_modificacion
    };
  }
}
