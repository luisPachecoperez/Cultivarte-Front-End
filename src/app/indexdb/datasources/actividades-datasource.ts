import { indexDB } from '../services/database.service';
import { GraphQLResponse } from '../../shared/interfaces/graphql-response.interface';
import { Personas_sedesDataSource } from './personas_sedes-datasource';

import { Actividades } from '../interfaces/actividades.interface';
import { Sedes } from '../interfaces/sedes.interface';
import { Parametros_generales } from '../interfaces/parametros_generales.interface';
import { Parametros_detalle } from '../interfaces/parametros_detalle.interface';
import { PreCreateActividad } from '../../shared/interfaces/pre-create-actividad.interface';
import { PersonasDataSource } from './personas-datasource';
import { Injectable } from '@angular/core';
import { SesionesDataSource } from './sesiones-datasource';
import { Sesiones } from '../interfaces/sesiones.interface';
import { Personas_grupo_interes } from '../interfaces/personas_grupo_interes.interface';
import { Personas } from '../interfaces/personas.interface';
import { Personas_sedes } from '../interfaces/personas_sedes.interface';
import { Asistencias } from '../interfaces/asistencias.interface';
import { PreAsistencia } from '../../shared/interfaces/pre-asistencia.interface';
import { inject } from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class ActividadesDataSource {
  private personasSedesDataSource = inject(Personas_sedesDataSource);
  private personasDataSource = inject(PersonasDataSource);
  private sesionesDataSource = inject(SesionesDataSource);

  constructor() {}
  async getAll(): Promise<Actividades[]> {
    return await indexDB.actividades.toArray();
  }

  async getById(id: string): Promise<Actividades | undefined> {
    return await indexDB.actividades.get(id);
  }

  async create(data: Actividades): Promise<GraphQLResponse> {
    if (
      typeof data.fecha_actividad === 'string' &&
      data.fecha_actividad.includes('-')
    ) {
      // ✅ Caso fecha tipo string con guiones → convertir a timestamp
      data.fecha_actividad = String(new Date(data.fecha_actividad).getTime());
    }
    if (
      typeof data.fecha_creacion === 'string' &&
      data.fecha_creacion.includes('-')
    ) {
      // ✅ Caso fecha tipo string con guiones → convertir a timestamp
      data.fecha_creacion = String(new Date(data.fecha_creacion).getTime());
    }
    if (
      typeof data.fecha_modificacion === 'string' &&
      data.fecha_modificacion.includes('-')
    ) {
      // ✅ Caso fecha tipo string con guiones → convertir a timestamp
      data.fecha_modificacion = String(new Date(data.fecha_modificacion).getTime());
    }

    console.log("Creando actividad: ",data)
    try {
      await indexDB.actividades.add(data);
      return {
        exitoso: 'S',
        mensaje: 'Registro creado exitosamente',
      };
    } catch (error: any) {
      console.error('Error al guardar:', error);
      return {
        exitoso: 'N',
        mensaje: `Error al guardar: ${error?.mensaje || error}`,
      };
    }
  }

  async update(
    id: string,
    changes: Partial<Actividades>
  ): Promise<GraphQLResponse> {
    try {
      const updated = await indexDB.actividades.update(id, changes);

      if (updated) {
        return {
          exitoso: 'S',
          mensaje: `Registro ${id} actualizado exitosamente`,
        };
      } else {
        return {
          exitoso: 'N',
          mensaje: `No se encontró la actividad con id ${id}`,
        };
      }
    } catch (error: any) {
      console.error(`Error al actualizar el Registro ${id}:`, error);
      return {
        exitoso: 'N',
        mensaje: `Error al actualizar el Registro ${id}: ${
          error?.mensaje || error
        }`,
      };
    }
  }
  async delete(id: string, soft: boolean): Promise<GraphQLResponse> {
    // 🔹 1. Obtener todas las sesiones ligadas a la actividad
    const sesiones = await indexDB.sesiones
      .where('id_actividad')
      .equals(id)
      .toArray();
    const actividad: Actividades | undefined=await this.getById(id)

    if (actividad && actividad.syncStatus === 'pending-create')
      soft = false; // Si la actividad no se ha sincronizado, hacer hard delete

    if (soft) {
      // 🔹 2a. Soft delete → marcar actividad y sesiones como eliminadas
      await indexDB.actividades.update(id, {
        deleted: true,
        syncStatus: 'pending-delete',
      });
      for (const ses of sesiones) {
        await indexDB.sesiones.update(ses.id_sesion, {
          deleted: true,
          syncStatus: 'pending-delete',
        });
      }
    } else {
      // 🔹 2b. Hard delete → borrar actividad y sesiones de indexDB
      await indexDB.actividades.delete(id);
      for (const ses of sesiones) {
        await indexDB.sesiones.delete(ses.id_sesion);
      }
    }

    //console.log(`Borrada la actividad ${id} y sus sesiones (soft=${soft})`);

    return {
      exitoso: 'S',
      mensaje: soft
        ? `Actividad ${id} y sus sesiones marcadas como eliminadas`
        : `Actividad ${id} y sus sesiones eliminadas definitivamente`,
    };
  }

  async bulkAdd(data: Actividades[]): Promise<void> {
    //console.log('Bulk add Actividades:', data);
    this.deleteFull();
    const withSyncStatus = data.map((item) => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced',
    }));
    await indexDB.actividades.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.actividades.clear();
  }

  async getBySedes(sedes: string[]): Promise<Actividades[]> {
    if (sedes.length === 0) {
      // Superusuario: trae todas menos las eliminadas
      return await indexDB.actividades
        .filter((a: Actividades) => !a.deleted) // 👈 excluye eliminados
        .toArray();
    }
    // Normal: filtrar actividades en esas sedes y que no estén eliminadas
    return await indexDB.actividades
      .where('id_sede')
      .anyOf(sedes)
      .filter((a: Actividades) => !a.deleted) // 👈 excluye eliminados
      .toArray();
  }
  async getActividadSesiones(id_actividad: string, id_usuario: string) {
    // 1. Obtener la actividad
    const actividad = (await indexDB.actividades.get(
      id_actividad
    )) as Actividades;
    if (!actividad) return null;

    // 2. Obtener sesiones de la actividad
    const sesiones = await indexDB.sesiones
      .where('id_actividad')
      .equals(id_actividad)
      .filter(
        (s) =>
          s.deleted === false || s.deleted === null || s.deleted === undefined
      )
      .toArray();

    // 3. Obtener parámetros generales y detalle
    const parametrosGenerales =
      (await indexDB.parametros_generales.toArray()) as Parametros_generales[];
    const parametrosDetalle =
      (await indexDB.parametros_detalle.toArray()) as Parametros_detalle[];

    // ✅ Optimización: Preprocesar mapas para búsquedas rápidas
    const mapaGenerales = new Map<string, Parametros_generales>();
    parametrosGenerales.forEach((pg) =>
      mapaGenerales.set(pg.nombre_parametro, pg)
    );

    const detallesPorGeneral = new Map<
      string,
      Array<{ id_parametro_detalle: string; nombre: string; valores: string }>
    >();
    parametrosDetalle.forEach((pd) => {
      const item = {
        id_parametro_detalle: pd.id_parametro_detalle,
        nombre: pd.nombre,
        valores: pd.valores,
      };
      if (!detallesPorGeneral.has(pd.id_parametro_general)) {
        detallesPorGeneral.set(pd.id_parametro_general, []);
      }
      detallesPorGeneral.get(pd.id_parametro_general)!.push(item);
    });

    const cache = new Map<
      string,
      Array<{ id_parametro_detalle: string; nombre: string }>
    >();

    const getDetalle = (nombreGeneral: string) => {
      if (cache.has(nombreGeneral)) {
        return cache.get(nombreGeneral)!;
      }

      const general = mapaGenerales.get(nombreGeneral);
      if (!general) {
        cache.set(nombreGeneral, []);
        return [];
      }

      const resultado =
        detallesPorGeneral.get(general.id_parametro_general) || [];
      cache.set(nombreGeneral, resultado);
      return resultado;
    };

    const tiposDeActividad = getDetalle('TIPO_ACTIVIDAD_CULTIVARTE');
    const responsables = getDetalle('RESPONSABLE_CULTIVARTE');
    const frecuencias = getDetalle('FRECUENCIA_CULTIVARTE');

    // 4. NombreEventos (split de valores)
    let nombreEventos: { id_parametro_detalle: string; nombre: string }[] = [];
    const generalTipoActividad = mapaGenerales.get('TIPO_ACTIVIDAD_CULTIVARTE');
    if (generalTipoActividad) {
      const detalles =
        detallesPorGeneral.get(generalTipoActividad.id_parametro_general) || [];

      nombreEventos = detalles.flatMap((det) =>
        det.valores
          ? det.valores.split(',').map((val) => ({
              id_parametro_detalle: det.id_parametro_detalle,
              nombre: val.trim(),
            }))
          : []
      );
    }

    // 5. Sedes y Aliados filtrados por usuario
    const sedesUsuario = await this.personasSedesDataSource.getSedesByUsuario(
      id_usuario
    );

    const paramGeneralTipoPersona = await indexDB.parametros_generales
      .where('nombre_parametro')
      .equalsIgnoreCase('TIPO_PERSONA')
      .first();

    let idNatural: string | null = null;
    let idJuridica: string | null = null;

    if (paramGeneralTipoPersona) {
      const detallesTipoPersona =
        detallesPorGeneral.get(paramGeneralTipoPersona.id_parametro_general) ||
        [];

      let natural = null;
      let juridica = null;

      for (const pd of detallesTipoPersona) {
        // 🔹 Normaliza a mayúsculas sin tildes
        const nombreUpper = pd.nombre
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase();

        if (nombreUpper === 'NATURAL') {
          natural = pd;
          if (juridica) break;
        } else if (nombreUpper === 'JURIDICA') {
          juridica = pd;
          if (natural) break;
        }
      }

      idNatural = natural?.id_parametro_detalle ?? null;
      idJuridica = juridica?.id_parametro_detalle ?? null;
    }
    let sedes: Sedes[];
    let aliados: { id_aliado: string; nombre: string }[];

    sedes =
      !sedesUsuario || sedesUsuario.length === 0
        ? await indexDB.sedes.toArray()
        : await indexDB.sedes.where('id_sede').anyOf(sedesUsuario).toArray();

    const aliadosQuery =
      !sedesUsuario || sedesUsuario.length === 0
        ? indexDB.aliados.toArray()
        : indexDB.aliados.where('id_sede').anyOf(sedesUsuario).toArray();

    aliados = (await aliadosQuery).map((a) => ({
      id_aliado: a.id_persona,
      nombre:
        a.id_tipo_persona === idNatural
          ? `${a.nombres} ${a.apellidos}`.trim()
          : a.razon_social,
    }));

    // 6. Construir objeto final estilo GraphQL
    return {
      ...actividad,
      sesiones,
      sedes,
      tiposDeActividad,
      aliados,
      responsables,
      nombreEventos,
      frecuencias,
    };
  }

  async getPreCreateActividad(id_usuario: string): Promise<PreCreateActividad> {
    //console.log('Obteniendo datos para PreCreateActividad IndexDB');
    // 1. Obtener parámetros generales y detalle
    const parametrosGenerales =
      (await indexDB.parametros_generales.toArray()) as Parametros_generales[];
    const parametrosDetalle =
      (await indexDB.parametros_detalle.toArray()) as Parametros_detalle[];

    //console.log('PreCreateActividad ParamGenerales:', parametrosGenerales);
    //console.log('PreCreateActividad ParamDetalle:', parametrosDetalle);

    const getDetalle = (
      nombreGeneral: string,
      mapId: string,
      mapNombre: string
    ) => {
      const general = parametrosGenerales.find(
        (pg) => pg.nombre_parametro === nombreGeneral
      );
      if (!general) return [];
      return parametrosDetalle
        .filter(
          (pd) => pd.id_parametro_general === general.id_parametro_general
        )
        .map((pd) => ({
          [mapId]: pd.id_parametro_detalle,
          [mapNombre]: pd.nombre,
        })) as any[];
    };

    // 2. Tipos de actividad, responsables y frecuencias, programa

    const programas = getDetalle('Programa', 'id_programa', 'nombre');
    //console.log('PreCreateActividad Programas:', programas);
    const programa = programas.filter(
      (a: any) => a.nombre.toUpperCase() === 'CULTIVARTE'
    )[0].id_programa;
    //console.log('PreCreateActividad Programa: ', programa);

    const tiposDeActividad = getDetalle(
      'TIPO_ACTIVIDAD_CULTIVARTE',
      'id_tipo_actividad',
      'nombre'
    );
    //console.log('PreCreateActividad Tipos de Actividad:', tiposDeActividad);
    const responsables = getDetalle(
      'RESPONSABLE_CULTIVARTE',
      'id_responsable',
      'nombre'
    );
    //console.log('PreCreateActividad Responsables:', responsables);
    const frecuencias = getDetalle(
      'FRECUENCIA_CULTIVARTE',
      'id_frecuencia',
      'nombre'
    );
    //console.log('PreCreateActividad Frecuencias:', frecuencias);

    // 3. nombreDeActividades (array plano con split de valores)
    let nombresDeActividad: { id_tipo_actividad: string; nombre: string }[] =
      [];
    const generalTipoActividad = parametrosGenerales.find(
      (pg) => pg.nombre_parametro === 'TIPO_ACTIVIDAD_CULTIVARTE'
    );
    //console.log('PreCreateActividad General Tipo Actividad:',generalTipoActividad );
    if (generalTipoActividad) {
      const detalles = parametrosDetalle.filter(
        (pd) =>
          pd.id_parametro_general === generalTipoActividad.id_parametro_general
      );
      //console.log('Tipos de actividad con valores:', detalles);
      for (const det of detalles) {
        if (det.valores) {
          const valores = det.valores.split(',').map((v) => v.trim());
          //console.log('Nombres de actividades de ', det.nombre, ' ', valores);
          valores.forEach((val) => {
            nombresDeActividad.push({
              id_tipo_actividad: det.id_parametro_detalle,
              nombre: val,
            });
          });
        }
      }
    }
    //console.log('PreCreateActividad Nombre de Actividades:',nombresDeActividad);
    // 4. Sedes y Aliados filtrados por usuario
    const aliados: { id_aliado: string; nombre: string }[] =
      await this.personasDataSource.getAliados(id_usuario);
    //console.log('PreCreateActividad Aliados:', aliados);
    const sedesUsuario = await this.personasSedesDataSource.getSedesByUsuario(
      id_usuario
    );
    //console.log('PreCreateActividad Sedes del usuario:', sedesUsuario);
    let sedes: { id_sede: string; nombre: string }[];

    // -- Buscar id_tipo_persona para "Natural"
    const paramGeneralTipoPersona = parametrosGenerales.find(
      (pg) => pg.nombre_parametro.toUpperCase() === 'TIPO_PERSONA'
    );
    //console.log('PreCreateActividad Param General Tipo Persona:',paramGeneralTipoPersona );
    let idNatural: string | null = null;
    if (paramGeneralTipoPersona) {
      const detallesTipoPersona = parametrosDetalle.filter(
        (pd) =>
          pd.id_parametro_general ===
          paramGeneralTipoPersona.id_parametro_general
      );
      const natural = detallesTipoPersona.find(
        (pd) => pd.nombre.toUpperCase() === 'NATURAL'
      );
      idNatural = natural?.id_parametro_detalle ?? null;
    }
    //console.log('PreCreateActividad Id Natural:', idNatural);
    if (!sedesUsuario || sedesUsuario.length === 0) {
      sedes = (await indexDB.sedes.toArray()).map((s) => ({
        id_sede: s.id_sede,
        nombre: s.nombre,
      }));
    } else {
      sedes = (
        await indexDB.sedes.where('id_sede').anyOf(sedesUsuario).toArray()
      ).map((s) => ({
        id_sede: s.id_sede,
        nombre: s.nombre,
      }));
    }
    //console.log('PreCreateActividad Sedes:', sedes);
    const respuesta: any = {
      id_programa: programa,
      sedes,
      tiposDeActividad,
      aliados,
      responsables,
      nombresDeActividad,
      frecuencias,
    };
    //console.log('PreCreateActividad IndexDB:', respuesta);
    // 5. Construir objeto final estilo GraphQL
    return respuesta;
  }

  async getPreEditActividad(id_actividad: string, id_usuario: string) {
    //console.log('Obteniendo datos para PreEditActividad IndexDB');
    // 1. Obtener parámetros generales y detalle
    const parametrosGenerales =
      (await indexDB.parametros_generales.toArray()) as Parametros_generales[];
    const parametrosDetalle =
      (await indexDB.parametros_detalle.toArray()) as Parametros_detalle[];

    //console.log('PreEditActividad ParamGenerales:', parametrosGenerales);
    //console.log('PreEditActividad ParamDetalle:', parametrosDetalle);

    const getDetalle = (
      nombreGeneral: string,
      mapId: string,
      mapNombre: string
    ) => {
      const general = parametrosGenerales.find(
        (pg) => pg.nombre_parametro === nombreGeneral
      );
      if (!general) return [];
      return parametrosDetalle
        .filter(
          (pd) => pd.id_parametro_general === general.id_parametro_general
        )
        .map((pd) => ({
          [mapId]: pd.id_parametro_detalle,
          [mapNombre]: pd.nombre,
        })) as any[];
    };

    // 2. Tipos de actividad, responsables y frecuencias, programa

    const programas = getDetalle('Programa', 'id_programa', 'nombre');
    //console.log('PreEditActividad Programas:', programas);
    const programa = programas.filter(
      (a: any) => a.nombre.toUpperCase() === 'CULTIVARTE'
    )[0].id_programa;
    //console.log('PreEditActividad Programa: ', programa);

    const tiposDeActividad = getDetalle(
      'TIPO_ACTIVIDAD_CULTIVARTE',
      'id_tipo_actividad',
      'nombre'
    );
    //console.log('PreEditActividad Tipos de Actividad:', tiposDeActividad);
    const responsables = getDetalle(
      'RESPONSABLE_CULTIVARTE',
      'id_responsable',
      'nombre'
    );
    //console.log('PreEditActividad Responsables:', responsables);
    const frecuencias = getDetalle(
      'FRECUENCIA_CULTIVARTE',
      'id_frecuencia',
      'nombre'
    );
    //console.log('PreEditActividad Frecuencias:', frecuencias);

    // 3. nombreDeActividades (array plano con split de valores)
    let nombresDeActividad: { id_tipo_actividad: string; nombre: string }[] =
      [];
    const generalTipoActividad = parametrosGenerales.find(
      (pg) => pg.nombre_parametro === 'TIPO_ACTIVIDAD_CULTIVARTE'
    );
    //console.log('PreEditActividad General Tipo Actividad:',generalTipoActividad);
    if (generalTipoActividad) {
      const detalles = parametrosDetalle.filter(
        (pd) =>
          pd.id_parametro_general === generalTipoActividad.id_parametro_general
      );
      //console.log('Tipos de actividad con valores:', detalles);
      for (const det of detalles) {
        if (det.valores) {
          const valores = det.valores.split(',').map((v) => v.trim());
          //console.log('Nombres de actividades de ', det.nombre, ' ', valores);
          valores.forEach((val) => {
            nombresDeActividad.push({
              id_tipo_actividad: det.id_parametro_detalle,
              nombre: val,
            });
          });
        }
      }
    }
    //console.log('PreEditActividad Nombre de Actividades:', nombresDeActividad);
    // 4. Sedes y Aliados filtrados por usuario
    const aliados: { id_aliado: string; nombre: string }[] =
      await this.personasDataSource.getAliados(id_usuario);
    //console.log('PreEditActividad Aliados:', aliados);
    const sedesUsuario = await this.personasSedesDataSource.getSedesByUsuario(
      id_usuario
    );
    //console.log('PreEditActividad Sedes del usuario:', sedesUsuario);
    let sedes: { id_sede: string; nombre: string }[];

    // -- Buscar id_tipo_persona para "Natural"
    const paramGeneralTipoPersona = parametrosGenerales.find(
      (pg) => pg.nombre_parametro.toUpperCase() === 'TIPO_PERSONA'
    );
    //console.log('PreEditActividad Param General Tipo Persona:',paramGeneralTipoPersona);
    let idNatural: string | null = null;
    if (paramGeneralTipoPersona) {
      const detallesTipoPersona = parametrosDetalle.filter(
        (pd) =>
          pd.id_parametro_general ===
          paramGeneralTipoPersona.id_parametro_general
      );
      const natural = detallesTipoPersona.find(
        (pd) => pd.nombre.toUpperCase() === 'NATURAL'
      );
      idNatural = natural?.id_parametro_detalle ?? null;
    }
    //console.log('PreEditActividad Id Natural:', idNatural);
    if (!sedesUsuario || sedesUsuario.length === 0) {
      sedes = (await indexDB.sedes.toArray()).map((s) => ({
        id_sede: s.id_sede,
        nombre: s.nombre,
      }));
    } else {
      sedes = (
        await indexDB.sedes.where('id_sede').anyOf(sedesUsuario).toArray()
      ).map((s) => ({
        id_sede: s.id_sede,
        nombre: s.nombre,
      }));
    }
    //console.log('PreEditActividad Sedes:', sedes);

    const actividad = await this.getById(id_actividad);
    const sesiones = (
      await this.sesionesDataSource.sesionesPorActividad(id_actividad)
    )
      // 🔹 Ordenamos por fecha antes de formatear
      .sort((a, b) => {
        const fechaA = new Date(+a.fecha_actividad).getTime();
        const fechaB = new Date(+b.fecha_actividad).getTime();
        return fechaA - fechaB; // ascendente (más antigua primero)
      })
      // 🔹 Luego mapeamos y formateamos
      .map((s) => ({
        ...s,
        fecha_actividad: new Date(+s.fecha_actividad)
          .toISOString()
          .split('T')[0], // yyyy-MM-dd
      }));
    const respuesta: any = {
      id_programa: programa,
      sedes,
      tiposDeActividad,
      aliados,
      responsables,
      nombresDeActividad,
      frecuencias,
      actividad,
      sesiones,
    };
    //console.log('PreEditActividad IndexDB:', respuesta);
    // 5. Construir objeto final estilo GraphQL
    return respuesta;
  }
  async consultarFechaCalendario(
    fechaInicio: Date,
    fechaFin: Date,
    idUsuario: string
  ): Promise<any[]> {
    /*//console.log('Buscando sesiones en rango:', {
      fechaInicio,
      fechaFin,
      idUsuario,
    });*/
    // 1. Usar el método de actividades
    const sedesUsuario = await this.personasSedesDataSource.getSedesByUsuario(
      idUsuario
    );
    //console.log('IndexDB Sedes del usuario:', idUsuario, sedesUsuario);
    const actividades = await this.getBySedes(sedesUsuario);
    //console.log('IndexDB Actividades en las sedes del usuario:', actividades);
    if (actividades.length === 0) return [];

    const idsActividades = actividades.map((a) => a.id_actividad);
    //console.log('IdsActividades en las sedes del usuario:', idsActividades);
    const ss = await indexDB.sesiones.toArray();
    //console.log('Todas_las sesiones en IndexDB:', ss);
    // //console.log('Las fechas en timestamp:', {inicio: fechaInicio.getTime(), fin: fechaFin.getTime()    });
    // 3. Filtrar sesiones en esas actividades y en el rango de fechas
    const sesiones = await indexDB.sesiones
      .where('fecha_actividad')
      .between(
        String(new Date(fechaInicio).getTime()),
        String(new Date(fechaFin).getTime()),
        true,
        true
      )
      .filter((s: Sesiones) => idsActividades.includes(s.id_actividad))
      .toArray();

    // 4. Para cada sesión, contar asistentes
    for (const sesion of sesiones) {
      const count = await indexDB.asistencias
        .where('id_sesion')
        .equals(sesion.id_sesion)
        .count();
      sesion.nro_asistentes = count;
      // 2. Obtener el nombre de la actividad correspondiente
      const actividad = await this.getById(sesion.id_actividad);
      sesion.nombre_actividad = actividad?.nombre_actividad || '';
    }

    //console.log('IndexDB Sesiones encontradas:', sesiones);

    const mappedSesiones = sesiones.map((s: Sesiones) => {
      const fecha = new Date(Number(s.fecha_actividad));
      const yyyyMMdd = fecha.toISOString().split('T')[0]; // yyyy-mm-dd
      return {
        id: s.id_sesion,
        title: s.nombre_actividad || '',
        start: `${yyyyMMdd} ${s.hora_inicio}`,
        end: `${yyyyMMdd} ${s.hora_fin}`,
        extendedProps: {
          id_actividad: s.id_actividad,
          id_sesion: s.id_sesion,
          fecha_actividad: `${yyyyMMdd}`,
          nombre_actividad: s.nombre_actividad,
          desde: `${yyyyMMdd} ${s.hora_inicio}`,
          hasta: `${yyyyMMdd} ${s.hora_fin}`,
          asistentes_evento: s.nro_asistentes ?? 0,
        },
      };
    });
    //console.log('Sesiones calendario:', mappedSesiones);
    return mappedSesiones;
  }

  async getPreAsistencia(id_sesion: string): Promise<any> {
    // 1. Obtener sesión base
    const sesion = await indexDB.sesiones.get(id_sesion);
    if (!sesion) {
      throw new Error(`Sesión ${id_sesion} no encontrada en IndexedDB`);
    }
    //console.log('Sesion preasistencias:', id_sesion);

    const sedes: Sedes[] = await indexDB.sedes.toArray();

    // 2. Obtener la actividad relacionada (para sede)
    const actividad = await this.getById(sesion.id_actividad);
    if (!actividad) {
      throw new Error(
        `Actividad ${sesion.id_actividad} no encontrada en IndexedDB`
      );
    }

    const paramTipoActividad = await indexDB.parametros_detalle
      .filter((pd) => pd.id_parametro_detalle === actividad.id_tipo_actividad)
      .first();

    const tipo_actividad: string = paramTipoActividad?.nombre ?? '';
    //console.log('Tipo de Actividad:', tipo_actividad);
    const foto =
      tipo_actividad?.toUpperCase() === 'ACTIVIDAD INSTITUCIONAL' ||
      tipo_actividad?.toUpperCase() === 'LUDOTECA VIAJERA'
        ? 'S'
        : 'N';

    const grupoInteresCultivarte: Parametros_generales | undefined =
      await indexDB.parametros_generales
        .filter(
          (pg) =>
            pg.nombre_parametro?.toUpperCase() === 'GRUPOS_INTERES_CULTIVARTE'
        )
        .first();

    const grupoBeneficiarioCultivarte: Parametros_detalle | undefined =
      await indexDB.parametros_detalle
        .filter(
          (gibc) =>
            gibc.id_parametro_general ===
            grupoInteresCultivarte?.id_parametro_general
        )
        .filter(
          (gibc) => gibc.nombre.toUpperCase() === 'BENEFICIARIO_CULTIVARTE'
        )
        .first();

    //console.log('GrupoBeneficiarioCultivarte:', grupoBeneficiarioCultivarte);

    const beneficiariosGruposInteres: Personas_grupo_interes[] | undefined =
      await indexDB.personas_grupo_interes
        .filter(
          (pgi) =>
            pgi.id_grupo_interes ===
            grupoBeneficiarioCultivarte?.id_parametro_detalle
        )
        .toArray();
    //console.log('benefiricariosGruposInteres:', grupoBeneficiarioCultivarte);
    const idsPersonasGrupo: string[] = beneficiariosGruposInteres.map(
      (pgi) => pgi.id_persona
    );

    const ps: Personas_sedes[] = await indexDB.personas_sedes.toArray();
    //console.log('Personas sedes:', ps);

    //console.log('idsPersonasGrupo:', idsPersonasGrupo);

    // 2. Traer todas las personas de una sola
    const personasBeneficiariosGrupo: (Personas | undefined)[] =
      await indexDB.personas.bulkGet(idsPersonasGrupo);

    //console.log('personasBeneficiariosGrupo:', personasBeneficiariosGrupo);

    const idsBeneficiarios = personasBeneficiariosGrupo
      .filter((p): p is Personas => !!p) // eliminar undefined
      .map((p) => p.id_persona);

    //console.log('idsBeneficiarios:', idsBeneficiarios);

    const personasSedes: Personas_sedes[] = await indexDB.personas_sedes
      .where('id_persona')
      .anyOf(idsBeneficiarios)
      .toArray();
    //console.log('personasSedes:', personasSedes);

    const beneficiarios = personasBeneficiariosGrupo
      .filter((p): p is Personas => !!p)
      .map((p) => {
        const sedePersona = personasSedes.find(
          (ps) => ps.id_persona === p.id_persona
        );
        return {
          id_persona: p.id_persona,
          nombre_completo: `${p.nombres} ${p.apellidos}`,
          id_sede: sedePersona?.id_sede ?? '',
          identificacion:p.identificacion // 👈 fallback vacío
        };
      });
    //console.log('beneficiarios:', beneficiarios);

    // 5. Asistentes a sesiones anteriores

    const asistentes: Asistencias[] = [];

    //console.log('Asistencias totales');
    const asistenciasSesion = await indexDB.asistencias
      .where('id_sesion')
      .equals(id_sesion)
      .toArray();

    //console.log('Asistencias sesion:', asistenciasSesion);

    if (asistenciasSesion.length > 0) {
      // Caso 1: la sesión YA tiene asistencias → devolverlas con eliminar = 'N'
      asistenciasSesion.forEach((a) =>
        asistentes.push({
          ...a,
          syncStatus: 'synced',
          deleted: false,
          eliminar: 'N',
        })
      );
    } else {
      const sesionesMismaActividad = await indexDB.sesiones
        .where('id_actividad')
        .equals(sesion.id_actividad)
        .and((s) => new Date(s.fecha_actividad) < new Date())
        .toArray();
      const asistentesPrevios: Asistencias[] = [];

      for (const s of sesionesMismaActividad) {
        const asistenciasPrev = await indexDB.asistencias
          .where('id_sesion')
          .equals(s.id_sesion)
          .toArray();

        asistentesPrevios.push(...asistenciasPrev);
      }

      const seen = new Set<string>();
      asistentesPrevios.forEach((a) => {
        if (!seen.has(a.id_persona)) {
          asistentes.push({
            ...a,
            syncStatus: 'synced',
            deleted: false,
            eliminar: 'S',
          });
          seen.add(a.id_persona);
        }
      });
    }

    const totalAsistencias = await indexDB.asistencias
      .where('id_sesion')
      .equals(id_sesion)
      .count();

    const preAsistencia: PreAsistencia = {
      id_sesion: sesion.id_sesion,
      id_sede: actividad.id_sede, // 👈 tomado de actividad
      numero_asistentes: totalAsistencias,
      foto: foto,
      descripcion: sesion.descripcion,
      imagen: sesion.imagen,
      sedes: sedes
        ? sedes.map((s) => ({ id_sede: s.id_sede, nombre: s.nombre }))
        : [],
      beneficiarios: beneficiarios.map((b) => ({
        id_persona: b.id_persona,
        nombre_completo: b.nombre_completo,
        id_sede: b.id_sede,
        identificacion:b.identificacion
      })),
      asistentes_sesiones: asistentes.map((a) => ({
        id_persona: a.id_persona,
        eliminar: a.eliminar,
      })),
    };
    //console.log('actividades-datasource:Preasistencia:', preAsistencia);
    return preAsistencia;
  }
}
