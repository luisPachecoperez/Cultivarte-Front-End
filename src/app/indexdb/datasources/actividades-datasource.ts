import { indexDB } from '../services/database.service';
import { GraphQLResponse } from '../../shared/interfaces/graphql-response.interface';
import { PersonasSedesDataSource } from './personas_sedes-datasource';
import { ActividadesDB } from '../interfaces/actividades.interface';
import { Sedes } from '../../eventos/interfaces/lista-sedes.interface';
import { ParametrosGeneralesDB } from '../interfaces/parametros_generales.interface';
import { ParametrosDetalleDB } from '../interfaces/parametros_detalle.interface';
import { PreCreateActividad } from '../../eventos/interfaces/pre-create-actividad.interface';
import { PersonasDataSource } from './personas-datasource';
import { Injectable, inject } from '@angular/core';
import { SesionesDataSource } from './sesiones-datasource';
import { SesionesDB } from '../interfaces/sesiones.interface';
import { PersonasGrupoInteresDB } from '../interfaces/personas_grupo_interes.interface';
import { PersonasDB } from '../interfaces/personas.interface';
import { PersonasSedesDB } from '../interfaces/personas_sedes.interface';
import { AsistenciasDB } from '../interfaces/asistencias.interface';
import { PreAsistencia } from '../../asistencia/interfaces/pre-asistencia.interface';
import { PreEditActividad } from '../../eventos/interfaces/pre-edit-actividad.interface';
import { Responsables } from '../../eventos/interfaces/lista-responsables-interface';
import { Frecuencias } from '../../eventos/interfaces/lista-frecuencias-interface';
import { TiposDeActividad } from '../../eventos/interfaces/lista-tipos-actividades-interface';
import { Programas } from '../../eventos/interfaces/lista-programas.interface';
import { NombresDeActividad } from '../../eventos/interfaces/lista-nombres-actividades.interface';

@Injectable({
  providedIn: 'root',
})
export class ActividadesDataSource {
  private readonly personasSedesDataSource = inject(PersonasSedesDataSource);
  private readonly personasDataSource = inject(PersonasDataSource);
  private readonly sesionesDataSource = inject(SesionesDataSource);

  private buildDetalle<T>(
    nombreGeneral: string,
    mapId: keyof T,
    mapNombre: keyof T,
    parametrosGenerales: ParametrosGeneralesDB[],
    parametrosDetalle: ParametrosDetalleDB[],
  ): T[] {
    const general = parametrosGenerales.find(
      (pg) => pg.nombre_parametro === nombreGeneral,
    );
    if (!general) return [];

    return parametrosDetalle
      .filter((pd) => pd.id_parametro_general === general.id_parametro_general)
      .map(
        (pd) =>
          ({
            [mapId]: pd.id_parametro_detalle,
            [mapNombre]: pd.nombre,
          }) as T,
      );
  }

  // 🔧 Helper para eliminar duplicados de conversión de fechas
  private normalizeDateFields(
    obj: Record<string, any>,
    fields: string[],
  ): void {
    for (const f of fields) {
      const val = obj[f];
      if (typeof val === 'string' && val.includes('-')) {
        obj[f] = String(new Date(val).getTime());
      }
    }
  }

  // 🔧 Helper para eliminar duplicados en generación de nombres de actividad
  private buildNombresDeActividad(
    parametrosGenerales: ParametrosGeneralesDB[],
    parametrosDetalle: ParametrosDetalleDB[],
  ): { id_tipo_actividad: string; nombre: string }[] {
    const resultado: { id_tipo_actividad: string; nombre: string }[] = [];
    const generalTipoActividad = parametrosGenerales.find(
      (pg) => pg.nombre_parametro === 'TIPO_ACTIVIDAD_CULTIVARTE',
    );
    if (generalTipoActividad) {
      const detalles = parametrosDetalle.filter(
        (pd) =>
          pd.id_parametro_general === generalTipoActividad.id_parametro_general,
      );
      for (const det of detalles) {
        if (det.valores) {
          const valores = det.valores.split(',').map((v) => v.trim());
          valores.forEach((val) => {
            resultado.push({
              id_tipo_actividad: det.id_parametro_detalle,
              nombre: val,
            });
          });
        }
      }
    }
    return resultado;
  }

  // 🔧 Helper para eliminar duplicados al obtener sedes
  private async getSedesFiltradas(
    sedesUsuario: string[],
  ): Promise<{ id_sede: string; nombre: string }[]> {
    if (!sedesUsuario || sedesUsuario.length === 0) {
      return (await indexDB.sedes.toArray()).map((s) => ({
        id_sede: s.id_sede,
        nombre: s.nombre,
      }));
    }
    return (
      await indexDB.sedes.where('id_sede').anyOf(sedesUsuario).toArray()
    ).map((s) => ({
      id_sede: s.id_sede,
      nombre: s.nombre,
    }));
  }

  constructor() {}

  async getAll(): Promise<ActividadesDB[]> {
    return await indexDB.actividades.toArray();
  }

  async getById(id: string): Promise<ActividadesDB | undefined> {
    return (await indexDB.actividades.get(id)) ?? undefined;
  }

  async create(data: ActividadesDB): Promise<GraphQLResponse> {
    // 🔹 Normaliza campos de fecha (reduce duplicación)
    this.normalizeDateFields(data, [
      'fecha_actividad',
      'fecha_creacion',
      'fecha_modificacion',
    ]);

    try {
      await indexDB.actividades.add(data).catch((error) => {
        console.error('Error explícito dentro de add():', error);
      });
      return {
        exitoso: 'S',
        mensaje: 'Registro creado exitosamente',
      } as GraphQLResponse;
    } catch (error: any) {
      console.error('Error al guardar:', error);
      return {
        exitoso: 'N',
        mensaje: 'Error al guardar' + error,
      };
    }
  }

  async update(
    id: string,
    changes: Partial<ActividadesDB>,
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
    } catch (error) {
      console.error(`Error al actualizar el Registro ${id}:`, error);
      return {
        exitoso: 'N',
        mensaje: `Error al actualizar el Registro ${id}
        }`,
      };
    }
  }

  async delete(id: string, soft: boolean): Promise<GraphQLResponse> {
    const sesiones = await indexDB.sesiones
      .where('id_actividad')
      .equals(id)
      .toArray();
    const actividad: ActividadesDB | undefined = await this.getById(id);

    if (actividad && actividad.syncStatus === 'pending-create') soft = false;

    if (soft) {
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
      await indexDB.actividades.delete(id);
      for (const ses of sesiones) {
        await indexDB.sesiones.delete(ses.id_sesion);
      }
    }

    return {
      exitoso: 'S',
      mensaje: soft
        ? `Actividad ${id} y sus sesiones marcadas como eliminadas`
        : `Actividad ${id} y sus sesiones eliminadas definitivamente`,
    };
  }

  async bulkAdd(data: ActividadesDB[]): Promise<void> {
    const withSyncStatus = data.map((item) => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced',
    }));
    await indexDB.actividades.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.actividades.clear();
  }

  async getBySedes(sedes: string[]): Promise<ActividadesDB[]> {
    if (sedes.length === 0) {
      return await indexDB.actividades
        .filter((a: ActividadesDB) => !a.deleted)
        .toArray();
    }
    return await indexDB.actividades
      .where('id_sede')
      .anyOf(sedes)
      .filter((a: ActividadesDB) => !a.deleted)
      .toArray();
  }

  async getPreCreateActividad(id_usuario: string): Promise<PreCreateActividad> {
    console.log('Obteniendo datos para PreCreateActividad IndexDB');

    const parametrosGenerales = await indexDB.parametros_generales.toArray();
    const parametrosDetalle = await indexDB.parametros_detalle.toArray();

    const programas = this.buildDetalle<Programas>(
      'PROGRAMAS_CULTIVARTE',
      'id_programa',
      'nombre',
      parametrosGenerales,
      parametrosDetalle,
    );

    const responsables = this.buildDetalle<Responsables>(
      'RESPONSABLE_CULTIVARTE',
      'id_responsable',
      'nombre',
      parametrosGenerales,
      parametrosDetalle,
    );
    const tiposDeActividad = this.buildDetalle<TiposDeActividad>(
      'TIPO_ACTIVIDAD_CULTIVARTE',
      'id_tipo_actividad',
      'nombre',
      parametrosGenerales,
      parametrosDetalle,
    );
    const frecuencias = this.buildDetalle<Frecuencias>(
      'FRECUENCIA_CULTIVARTE',
      'id_frecuencia',
      'nombre',
      parametrosGenerales,
      parametrosDetalle,
    );

    let programa: string =
      programas.find(
        (a: Programas) => a?.nombre?.toUpperCase() === 'CULTIVARTE',
      )?.id_programa ?? '';

    programa = programa ?? ' ';

    // 🔹 Uso del helper para evitar duplicación
    const nombresDeActividad = this.buildNombresDeActividad(
      parametrosGenerales,
      parametrosDetalle,
    );

    const aliados: { id_aliado: string; nombre: string }[] =
      await this.personasDataSource.getAliados(id_usuario);
    console.log('PreCreateActividad Aliados:', aliados);

    const sedesUsuario =
      await this.personasSedesDataSource.getSedesByUsuario(id_usuario);
    const sedes = await this.getSedesFiltradas(sedesUsuario);

    const respuesta: PreCreateActividad = {
      id_programa: programa,
      sedes,
      tiposDeActividad,
      aliados,
      responsables,
      nombresDeActividad,
      frecuencias,
    };
    return respuesta;
  }

  async getPreEditActividad(
    id_actividad: string,
    id_usuario: string,
  ): Promise<PreEditActividad> {
    const parametrosGenerales = await indexDB.parametros_generales.toArray();
    const parametrosDetalle = await indexDB.parametros_detalle.toArray();

    const responsables = this.buildDetalle<Responsables>(
      'RESPONSABLE_CULTIVARTE',
      'id_responsable',
      'nombre',
      parametrosGenerales,
      parametrosDetalle,
    );
    const tiposDeActividad = this.buildDetalle<TiposDeActividad>(
      'TIPO_ACTIVIDAD_CULTIVARTE',
      'id_tipo_actividad',
      'nombre',
      parametrosGenerales,
      parametrosDetalle,
    );
    const frecuencias = this.buildDetalle<Frecuencias>(
      'FRECUENCIA_CULTIVARTE',
      'id_frecuencia',
      'nombre',
      parametrosGenerales,
      parametrosDetalle,
    );

    // 🔹 Reutiliza helper para nombres de actividad
    const nombresDeActividad = this.buildNombresDeActividad(
      parametrosGenerales,
      parametrosDetalle,
    );

    const aliados: { id_aliado: string; nombre: string }[] =
      await this.personasDataSource.getAliados(id_usuario);
    const sedesUsuario =
      await this.personasSedesDataSource.getSedesByUsuario(id_usuario);
    const sedes = await this.getSedesFiltradas(sedesUsuario);

    const actividad: ActividadesDB | undefined =
      await this.getById(id_actividad);
    const sesiones = (
      await this.sesionesDataSource.sesionesPorActividad(id_actividad)
    )
      .sort((a, b) => {
        if (
          a.fecha_actividad === undefined ||
          b.fecha_actividad === undefined ||
          a.fecha_actividad === null ||
          b.fecha_actividad === null
        )
          return 1;
        const fechaA = new Date(+a.fecha_actividad).getTime();
        const fechaB = new Date(+b.fecha_actividad).getTime();
        return fechaA - fechaB;
      })
      .map((s) => ({
        ...s,
        fecha_actividad: new Date(
          s.fecha_actividad ? +s.fecha_actividad : Date.now(),
        )
          .toISOString()
          .split('T')[0],
      }));
    const respuesta: PreEditActividad = {
      id_programa: actividad.id_programa || '',
      sedes,
      tiposDeActividad,
      aliados,
      responsables,
      nombresDeActividad,
      frecuencias,
      actividad,
      sesiones,
    };
    return respuesta;
  }

  async consultarFechaCalendario(
    fechaInicio: Date,
    fechaFin: Date,
    idUsuario: string,
  ): Promise<any[]> {
    const sedesUsuario =
      await this.personasSedesDataSource.getSedesByUsuario(idUsuario);
    const actividades = await this.getBySedes(sedesUsuario);
    if (actividades.length === 0) return [];

    const idsActividades = new Set(actividades.map((a) => a.id_actividad));
    const sesiones = await indexDB.sesiones
      .where('fecha_actividad')
      .between(
        String(new Date(fechaInicio).getTime()),
        String(new Date(fechaFin).getTime()),
        true,
        true,
      )
      .filter((s: SesionesDB) => idsActividades.has(s.id_actividad))
      .toArray();

    for (const sesion of sesiones) {
      const count = await indexDB.asistencias
        .where('id_sesion')
        .equals(sesion.id_sesion)
        .count();
      sesion.nro_asistentes = count;
      const actividad = await this.getById(sesion.id_actividad ?? '');
      sesion.nombre_actividad = actividad?.nombre_actividad || '';
    }

    const asistentesPorActividad = new Map<string, number>();

    sesiones.forEach((sesion) => {
      if (!asistentesPorActividad.has(sesion.id_actividad)) {
        asistentesPorActividad.set(sesion.id_actividad, 0);
      }
      asistentesPorActividad.set(
        sesion.id_actividad,
        (asistentesPorActividad.get(sesion.id_actividad) ?? 0) +
          (sesion.nro_asistentes ?? 0),
      );
    });

    const mappedSesiones = sesiones.map((s: SesionesDB) => {
      const fecha = new Date(Number(s.fecha_actividad));
      const yyyyMMdd = fecha.toISOString().split('T')[0];
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
          asistentes_evento: asistentesPorActividad.get(s.id_actividad) ?? 0,
        },
      };
    });
    return mappedSesiones;
  }

  async getPreAsistencia(id_sesion: string): Promise<any> {
    // 1. Obtener sesión base
    const sesion = await indexDB.sesiones.get(id_sesion);
    if (!sesion) {
      throw new Error(`Sesión ${id_sesion} no encontrada en IndexedDB`);
    }

    const sedes: Sedes[] = await indexDB.sedes.toArray();

    // 2. Obtener la actividad relacionada (para sede)
    const actividad: ActividadesDB | undefined = await this.getById(
      sesion.id_actividad ?? '',
    );
    if (!actividad) {
      throw new Error(
        `Actividad ${sesion.id_actividad ?? ''} no encontrada en IndexedDB`,
      );
    }

    const paramTipoActividad = await indexDB.parametros_detalle
      .filter((pd) => pd.id_parametro_detalle === actividad.id_tipo_actividad)
      .first();

    const tipo_actividad: string = paramTipoActividad?.nombre ?? '';
    const foto =
      tipo_actividad?.toUpperCase() === 'ACTIVIDAD INSTITUCIONAL' ||
      tipo_actividad?.toUpperCase() === 'LUDOTECA VIAJERA'
        ? 'S'
        : 'N';

    const grupoInteresCultivarte: ParametrosGeneralesDB | undefined =
      await indexDB.parametros_generales
        .filter(
          (pg) =>
            pg.nombre_parametro?.toUpperCase() === 'GRUPOS_INTERES_CULTIVARTE',
        )
        .first();

    const grupoBeneficiarioCultivarte: ParametrosDetalleDB | undefined =
      await indexDB.parametros_detalle
        .filter(
          (gibc) =>
            gibc.id_parametro_general ===
            grupoInteresCultivarte?.id_parametro_general,
        )
        .filter(
          (gibc) => gibc.nombre.toUpperCase() === 'BENEFICIARIO_CULTIVARTE',
        )
        .first();

    const beneficiariosGruposInteres: PersonasGrupoInteresDB[] | undefined =
      await indexDB.personas_grupo_interes
        .filter(
          (pgi) =>
            pgi.id_grupo_interes ===
            grupoBeneficiarioCultivarte?.id_parametro_detalle,
        )
        .toArray();
    const idsPersonasGrupo: string[] = beneficiariosGruposInteres.map(
      (pgi) => pgi.id_persona,
    );

    // 2. Traer todas las personas de una sola
    const personasBeneficiariosGrupo: (PersonasDB | undefined)[] =
      await indexDB.personas.bulkGet(idsPersonasGrupo);

    const idsBeneficiarios = personasBeneficiariosGrupo
      .filter((p): p is PersonasDB => !!p) // eliminar undefined
      .map((p) => p.id_persona);

    const personasSedes: PersonasSedesDB[] = await indexDB.personas_sedes
      .where('id_persona')
      .anyOf(idsBeneficiarios)
      .toArray();

    const beneficiarios = personasBeneficiariosGrupo
      .filter((p): p is PersonasDB => !!p)
      .map((p) => {
        const sedePersona = personasSedes.find(
          (ps) => ps.id_persona === p.id_persona,
        );
        return {
          id_persona: p.id_persona,
          nombre_completo: `${p.nombres} ${p.apellidos}`,
          id_sede: sedePersona?.id_sede ?? '',
          identificacion: p.identificacion,
        };
      });

    // 5. Asistentes a sesiones anteriores
    const asistentes: AsistenciasDB[] = [];

    const asistenciasSesion = await indexDB.asistencias
      .where('id_sesion')
      .equals(id_sesion)
      .toArray();

    if (asistenciasSesion.length > 0) {
      // Caso 1: la sesión YA tiene asistencias → devolverlas con eliminar = 'N'
      asistenciasSesion.forEach((a) =>
        asistentes.push({
          ...a,
          syncStatus: 'synced',
          deleted: false,
          eliminar: 'N',
        }),
      );
    } else {
      const sesionesMismaActividad = await indexDB.sesiones
        .where('id_actividad')
        .equals(sesion.id_actividad ?? '')
        //.and((s) => new Date(s.fecha_actividad ?? '') < new Date())
        .toArray();
      const asistentesPrevios: AsistenciasDB[] = [];

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
      id_sesion: sesion.id_sesion ?? '',
      id_sede: actividad.id_sede ?? '', // 👈 tomado de actividad
      numero_asistentes: totalAsistencias,
      foto: foto,
      descripcion: sesion.descripcion ?? '',
      imagen: sesion.imagen ?? '',
      sedes: sedes
        ? sedes.map((s) => ({ id_sede: s.id_sede, nombre: s.nombre }))
        : [],
      beneficiarios: beneficiarios.map((b) => ({
        id_persona: b.id_persona,
        nombre_completo: b.nombre_completo,
        id_sede: b.id_sede,
        identificacion: b.identificacion,
      })),
      asistentes_sesiones: asistentes.map((a) => ({
        id_persona: a.id_persona,
        eliminar: a.eliminar ?? '',
      })),
    };
    return preAsistencia;
  }
}
