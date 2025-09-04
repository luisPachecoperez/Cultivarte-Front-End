import { Injectable } from '@angular/core';
import { indexDB } from '../services/database.service';
import { GraphQLResponse } from '../../shared/interfaces/graphql-response.model';
import { Personas_sedesDataSource } from './personas_sedes-datasource';

import { Actividades } from '../interfaces/actividades';
import { Sedes } from '../interfaces/sedes';
import { Parametros_generales } from '../interfaces/parametros_generales';
import { Parametros_detalle } from '../interfaces/parametros_detalle';
import { PreCreateActividad } from '../interfaces/pre-create-actividad';

@Injectable({
  providedIn: 'root'
})

export class ActividadesDataSource {
  private personasSedes = new Personas_sedesDataSource();

  async getAll(): Promise<Actividades[]> {
    return await indexDB.actividades.toArray();
  }

  async getById(id: string): Promise<Actividades | undefined> {
    return await indexDB.actividades.get(id);
  }

  async create(data: Actividades): Promise<GraphQLResponse> {
    try {
      data.syncStatus = 'pending'; // Inicialmente en "pending"
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
      changes.syncStatus = 'pending'; // Inicialmente en "pending"
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
  async delete(id: string): Promise<GraphQLResponse> {
    try {
      const updated = await indexDB.actividades.update(id, {
        deleted: true,
        syncStatus: 'pending', // 👈 importante para luego sincronizar con el back
      });

      if (updated) {
        return {
          exitoso: 'S',
          mensaje: `Registro ${id} marcado como eliminado`,
        };
      } else {
        return {
          exitoso: 'N',
          mensaje: `No se encontró la actividad con id ${id}`,
        };
      }
    } catch (error: any) {
      console.error(`Error al marcar como eliminado el Registro ${id}:`, error);
      return {
        exitoso: 'N',
        mensaje: `Error al marcar como eliminado el Registro ${id}: ${
          error?.mensaje || error
        }`,
      };
    }
  }

  async bulkAdd(data: Actividades[]): Promise<void> {
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
  async getActividadSesiones(id_actividad: string, idUsuario: string) {
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

    const getDetalle = (nombreGeneral: string) => {
      const general = parametrosGenerales.find(
        (pg) => pg.nombre_parametro === nombreGeneral
      );
      if (!general) return [];
      return parametrosDetalle
        .filter(
          (pd) => pd.id_parametro_general === general.id_parametro_general
        )
        .map((pd) => ({
          id_parametro_detalle: pd.id_parametro_detalle,
          nombre: pd.nombre,
        }));
    };

    const tiposDeActividad = getDetalle('TIPO_ACTIVIDAD_CULTIVARTE');
    const responsables = getDetalle('RESPONSABLE_CULTIVARTE');
    const frecuencias = getDetalle('FRECUENCIA_CULTIVARTE');

    // 4. NombreEventos (split de valores)
    let nombreEventos: { id_parametro_detalle: string; nombre: string }[] = [];
    const generalTipoActividad = parametrosGenerales.find(
      (pg) => pg.nombre_parametro === 'TIPO_ACTIVIDAD_CULTIVARTE'
    );
    if (generalTipoActividad) {
      const detalles = parametrosDetalle.filter(
        (pd) =>
          pd.id_parametro_general === generalTipoActividad.id_parametro_general
      );
      for (const det of detalles) {
        if (det.valores) {
          const valores = det.valores.split(',').map((v) => v.trim());
          valores.forEach((val) => {
            nombreEventos.push({
              id_parametro_detalle: det.id_parametro_detalle,
              nombre: val,
            });
          });
        }
      }
    }

    // 5. Sedes y Aliados filtrados por usuario
    // 5. Sedes y Aliados filtrados por usuario
    const sedesUsuario = await this.personasSedes.getSedesByUsuario(idUsuario);
    let sedes: Sedes[];
    let aliados: { id_aliado: string; nombre: string }[];

    // -- Buscar id_tipo_persona para "Natural" y "Jurídica"
    const paramGeneralTipoPersona = (
      await indexDB.parametros_generales.toArray()
    ).find((pg) => pg.nombre_parametro.toUpperCase() === 'TIPO_PERSONA');

    let idNatural: string | null = null;
    let idJuridica: string | null = null;

    if (paramGeneralTipoPersona) {
      const detallesTipoPersona = await indexDB.parametros_detalle
        .where('id_parametro_general')
        .equals(paramGeneralTipoPersona.id_parametro_general)
        .toArray();

      const natural = detallesTipoPersona.find(
        (pd) => pd.nombre.toUpperCase() === 'NATURAL'
      );
      const juridica = detallesTipoPersona.find(
        (pd) => pd.nombre.toUpperCase() === 'JURÍDICA'
      );

      idNatural = natural?.id_parametro_detalle ?? null;
      idJuridica = juridica?.id_parametro_detalle ?? null;
    }

    if (!sedesUsuario || sedesUsuario.length === 0) {
      sedes = await indexDB.sedes.toArray();
      aliados = (await indexDB.aliados.toArray()).map((a) => ({
        id_aliado: a.id_persona,
        nombre:
          a.id_tipo_persona === idNatural
            ? `${a.nombres} ${a.apellidos}`.trim()
            : a.razon_social,
      }));
    } else {
      sedes = await indexDB.sedes
        .where('id_sede')
        .anyOf(sedesUsuario)
        .toArray();
      aliados = (
        await indexDB.aliados.where('id_sede').anyOf(sedesUsuario).toArray()
      ).map((a) => ({
        id_aliado: a.id_persona,
        nombre:
          a.id_tipo_persona === idNatural
            ? `${a.nombres} ${a.apellidos}`.trim()
            : a.razon_social,
      }));
    }

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


  async getPreCreateActividad(idUsuario: string): Promise<PreCreateActividad> {
    // 1. Obtener parámetros generales y detalle
    const parametrosGenerales = await indexDB.parametros_generales.toArray() as Parametros_generales[];
    const parametrosDetalle = await indexDB.parametros_detalle.toArray() as Parametros_detalle[];

    const getDetalle = (nombreGeneral: string, mapId: string, mapNombre: string) => {
      const general = parametrosGenerales.find(pg => pg.nombre_parametro === nombreGeneral);
      if (!general) return [];
      return parametrosDetalle
        .filter(pd => pd.id_parametro_general === general.id_parametro_general)
        .map(pd => ({
          [mapId]: pd.id_parametro_detalle,
          [mapNombre]: pd.nombre,
        })) as any[];
    };

    // 2. Tipos de actividad, responsables y frecuencias
    const tiposDeActividad = getDetalle('TIPO_ACTIVIDAD_CULTIVARTE', 'id_tipo_actividad', 'nombre');
    const responsables     = getDetalle('RESPONSABLE_CULTIVARTE', 'id_parametro_detalle', 'nombre');
    const frecuencias      = getDetalle('FRECUENCIA_CULTIVARTE', 'id_frecuencia', 'nombre');

    // 3. nombreDeActividades (array plano con split de valores)
    let nombreDeActividades: { id_tipo_actividad: string; nombre: string }[] = [];
    const generalTipoActividad = parametrosGenerales.find(pg => pg.nombre_parametro === 'TIPO_ACTIVIDAD_CULTIVARTE');
    if (generalTipoActividad) {
      const detalles = parametrosDetalle.filter(
        pd => pd.id_parametro_general === generalTipoActividad.id_parametro_general
      );
      for (const det of detalles) {
        if (det.valores) {
          const valores = det.valores.split(',').map(v => v.trim());
          valores.forEach(val => {
            nombreDeActividades.push({
              id_tipo_actividad: det.id_parametro_detalle,
              nombre: val,
            });
          });
        }
      }
    }

    // 4. Sedes y Aliados filtrados por usuario
    const sedesUsuario = await this.personasSedes.getSedesByUsuario(idUsuario);
    let sedes: { id_sede: string; nombre: string }[];
    let aliados: { id_aliado: string; nombre: string }[];

    // -- Buscar id_tipo_persona para "Natural"
    const paramGeneralTipoPersona = parametrosGenerales.find(
      pg => pg.nombre_parametro.toUpperCase() === 'TIPO_PERSONA'
    );

    let idNatural: string | null = null;
    if (paramGeneralTipoPersona) {
      const detallesTipoPersona = parametrosDetalle.filter(
        pd => pd.id_parametro_general === paramGeneralTipoPersona.id_parametro_general
      );
      const natural = detallesTipoPersona.find(pd => pd.nombre.toUpperCase() === 'NATURAL');
      idNatural = natural?.id_parametro_detalle ?? null;
    }

    if (!sedesUsuario || sedesUsuario.length === 0) {
      sedes = (await indexDB.sedes.toArray()).map(s => ({
        id_sede: s.id_sede,
        nombre: s.nombre,
      }));
      aliados = (await indexDB.aliados.toArray()).map(a => ({
        id_aliado: a.id_persona,
        nombre: a.id_tipo_persona === idNatural
          ? `${a.nombres} ${a.apellidos}`.trim()
          : a.razon_social,
      }));
    } else {
      sedes = (
        await indexDB.sedes.where('id_sede').anyOf(sedesUsuario).toArray()
      ).map(s => ({
        id_sede: s.id_sede,
        nombre: s.nombre,
      }));
      aliados = (
        await indexDB.aliados.where('id_sede').anyOf(sedesUsuario).toArray()
      ).map(a => ({
        id_aliado: a.id_persona,
        nombre: a.id_tipo_persona === idNatural
          ? `${a.nombres} ${a.apellidos}`.trim()
          : a.razon_social,
      }));
    }

    // 5. Construir objeto final estilo GraphQL
    return {
      id_programa: '',
      sedes,
      tiposDeActividad,
      aliados,
      responsables,
      nombreDeActividades,
      frecuencias,
    };
  }

}
