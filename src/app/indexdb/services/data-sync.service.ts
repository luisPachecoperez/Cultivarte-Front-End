import { Injectable, inject } from '@angular/core';
import { interval, of, from, firstValueFrom } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { indexDB } from './database.service';
import { ActividadesDataSource } from '../datasources/actividades-datasource';
import { SesionesDataSource } from '../datasources/sesiones-datasource';
import { AsistenciasDataSource } from '../datasources/asistencias-datasource';
import { GraphQLService } from '../../shared/services/graphql.service';
import { LoadIndexDBService } from './load-index-db.service';
import { SesionesDB } from '../interfaces/sesiones.interface';
import { ActividadesDB } from '../interfaces/actividades.interface';

@Injectable({ providedIn: 'root' })
export class DataSyncService {
  private readonly CREATE_ACTIVIDAD = `
    mutation CreateActividad($data: ActividadInput!) {
      createActividad(data: $data) {
        mensaje
        exitoso
      }
    }
  `;

  private readonly CREATE_SESION = `
    mutation CreateSesion($input: CreateSesionInput!) {
      createSesion(input: $input) {
        exitoso
        mensaje
      }
    }
  `;

  private readonly UPDATE_SESION = `
    mutation UpdateSesion($input: UpdateSesionInput!) {
      updateSesion(input: $input) {
        exitoso
        mensaje
      }
    }
  `;

  private readonly DELETE_SESION = `
    mutation DeleteSesion($id_sesion: ID!) {
      deleteSesion(id_sesion: $id_sesion) {
        exitoso
        mensaje
      }
    }
  `;

  private readonly UPDATE_ASISTENCIAS = `
    mutation UpdateAsistencias($input: UpdateAsistenciaInput!) {
      updateAsistencias(input: $input) {
        exitoso
        mensaje
      }
    }
  `;

  private readonly loadIndexDBService = inject(LoadIndexDBService);

  constructor(
    private readonly actividadesDataSource: ActividadesDataSource,
    private readonly sesionesDataSource: SesionesDataSource,
    private readonly asistenciasDataSource: AsistenciasDataSource,
    private readonly graphQLService: GraphQLService,
  ) {}

  // --------------------------------------------------------------------------
  // 🔧 Helper genérico (arreglado para Dexie PromiseExtended)
  // --------------------------------------------------------------------------
  private async syncEntity<T extends object>(
    entityName: string,
    id: string,
    getEntity: (id: string) => PromiseLike<T | undefined>,
    buildInput: (entity: T) => Record<string, unknown>,
    gqlMutation: string,
    resultKey: string,
    updateEntity: (id: string, data: Partial<T>) => Promise<unknown>,
  ): Promise<void> {
    const entity = await getEntity(id);
    if (!entity) {
      console.warn(`⚠️ ${entityName} ${id} no encontrada en indexDB`);
      return;
    }

    const input = buildInput(entity);

    try {
      const resp = await firstValueFrom(
        this.graphQLService.mutation<
          Record<string, { mensaje: string; exitoso: string }>
        >(gqlMutation, { input }),
      );

      const result = resp[resultKey];
      if (result?.exitoso === 'S') {
        await updateEntity(id, {
          ...entity,
          syncStatus: 'synced',
          deleted: false,
        });
      } else {
        console.warn(
          `❌ ${entityName} ${id} no sincronizada:`,
          result?.mensaje,
        );
      }
    } catch (err) {
      console.error(`❌ Error sincronizando ${entityName} ${id}:`, err);
    }
  }

  // --------------------------------------------------------------------------
  // 🔹 Proceso principal
  // --------------------------------------------------------------------------

  async startSync(): Promise<void> {
    await this.syncPending();
    interval(1000 * 60)
      .pipe(switchMap(() => from(this.syncPending())))
      .subscribe();
  }

  private async syncPending(): Promise<void> {
    const backendActivo = await this.pingBackend();
    if (!backendActivo) {
      console.warn('⚠️ Backend inactivo, no se sincroniza todavía');
      return;
    }
    await this.syncActividadesPendientes();
    await this.syncSesionesPendientes();
    await this.syncAsistenciasPendientes();
  }

  // --------------------------------------------------------------------------
  // 🔹 Actividades
  // --------------------------------------------------------------------------

  async syncActividadesPendientes(): Promise<void> {
    const actividadesPendientes = await indexDB.actividades
      .filter(
        (s) =>
          s.syncStatus === 'pending-create' ||
          s.syncStatus === 'pending-update' ||
          s.deleted === true,
      )
      .toArray();

    for (const act of actividadesPendientes) {
      await this.crearActividades(act.id_actividad ?? '');
    }
  }

  async crearActividades(id_actividad: string): Promise<void> {
    await this.syncEntity<ActividadesDB>(
      'Actividad',
      id_actividad,
      (id) => indexDB.actividades.get(id),
      (a) => ({
        plazo_asistencia: a.plazo_asistencia ?? null,
        nombre_actividad: a.nombre_actividad ?? null,
        institucional: a.institucional ?? null,
        id_tipo_actividad: a.id_tipo_actividad ?? null,
        id_sede: a.id_sede ?? null,
        id_responsable: a.id_responsable ?? null,
        id_programa: a.id_programa ?? null,
        id_modificado_por: a.id_modificado_por ?? null,
        id_frecuencia: a.id_frecuencia ?? null,
        id_creado_por: a.id_creado_por ?? null,
        id_aliado: a.id_aliado ?? null,
        id_actividad: a.id_actividad ?? null,
        hora_inicio: a.hora_inicio ?? null,
        hora_fin: a.hora_fin ?? null,
        fecha_modificacion: this.toDateOnly(a.fecha_modificacion as string),
        fecha_creacion: this.toDateOnly(a.fecha_creacion as string),
        fecha_actividad: this.toDateOnly(a.fecha_actividad as string),
        estado: a.estado ?? null,
        descripcion: a.descripcion ?? null,
      }),
      this.CREATE_ACTIVIDAD,
      'createActividad',
      (id, data) => this.actividadesDataSource.update(id, data),
    );
  }

  // --------------------------------------------------------------------------
  // 🔹 Sesiones
  // --------------------------------------------------------------------------

  async syncSesionesPendientes(): Promise<void> {
    const sesionesPendientes = await indexDB.sesiones
      .filter(
        (s) =>
          s.syncStatus === 'pending-create' ||
          s.syncStatus === 'pending-update' ||
          s.deleted === true,
      )
      .toArray();

    for (const ses of sesionesPendientes) {
      if (ses.deleted === true) {
        await this.sesionesDataSource.update(ses.id_sesion ?? '', {
          ...ses,
          syncStatus: 'pending-delete',
        });
        ses.syncStatus = 'pending-delete';
      }
    }

    for (const ses of sesionesPendientes) {
      switch (ses.syncStatus) {
        case 'pending-create':
          await this.crearSesiones(ses.id_sesion ?? '');
          break;
        case 'pending-update':
          await this.updateSesiones(ses.id_sesion ?? '');
          break;
        case 'pending-delete':
          await this.deleteSesion(ses.id_sesion ?? '');
          break;
        default:
      }
    }
  }

  async crearSesiones(id_sesion: string): Promise<void> {
    await this.syncEntity<SesionesDB>(
      'Sesión',
      id_sesion,
      (id) => indexDB.sesiones.get(id),
      (s) => ({
        nro_asistentes: s.nro_asistentes ?? null,
        imagen: s.imagen ?? null,
        id_sesion: s.id_sesion ?? null,
        id_modificado_por: s.id_modificado_por ?? null,
        id_creado_por: s.id_creado_por ?? null,
        id_actividad: s.id_actividad ?? null,
        hora_inicio: s.hora_inicio ?? null,
        hora_fin: s.hora_fin ?? null,
        fecha_modificacion: this.toDateOnly(s.fecha_modificacion as string),
        fecha_creacion: this.toDateOnly(s.fecha_creacion as string),
        fecha_actividad: this.toDateOnly(s.fecha_actividad as string),
        descripcion: s.descripcion ?? null,
      }),
      this.CREATE_SESION,
      'createSesion',
      (id, data) => this.sesionesDataSource.update(id, data),
    );
  }

  async updateSesiones(id_sesion: string): Promise<void> {
    await this.syncEntity<SesionesDB>(
      'Sesión',
      id_sesion,
      (id) => indexDB.sesiones.get(id),
      (s) => ({
        nro_asistentes: s.nro_asistentes ?? null,
        imagen: s.imagen ?? null,
        id_sesion: s.id_sesion ?? null,
        id_modificado_por: s.id_modificado_por ?? null,
        id_creado_por: s.id_creado_por ?? null,
        id_actividad: s.id_actividad ?? null,
        hora_inicio: s.hora_inicio ?? null,
        hora_fin: s.hora_fin ?? null,
        fecha_modificacion: this.toDateOnly(s.fecha_modificacion as string),
        fecha_creacion: this.toDateOnly(s.fecha_creacion as string),
        fecha_actividad: this.toDateOnly(s.fecha_actividad as string),
        descripcion: s.descripcion ?? null,
      }),
      this.UPDATE_SESION,
      'updateSesion',
      (id, data) => this.sesionesDataSource.update(id, data),
    );
  }

  // --------------------------------------------------------------------------
  // 🔹 Asistencias
  // --------------------------------------------------------------------------

  async syncAsistenciasPendientes(): Promise<void> {
    const asistenciasPendientes = await indexDB.asistencias
      .filter(
        (s) =>
          s.syncStatus === 'pending-create' ||
          s.syncStatus === 'pending-update' ||
          s.deleted === true,
      )
      .toArray();

    if (asistenciasPendientes.length === 0) return;

    const grupos = asistenciasPendientes.reduce<
      Map<string, (typeof asistenciasPendientes)[number][]>
    >((map, asis) => {
      if (!asis.id_sesion) return map;
      const list = map.get(asis.id_sesion) ?? [];
      list.push(asis);
      map.set(asis.id_sesion, list);
      return map;
    }, new Map());

    for (const [id_sesion, asistenciasDeSesion] of grupos.entries()) {
      const sesion = await indexDB.sesiones.get(id_sesion);
      if (!sesion) {
        console.warn(`⚠️ Sesión ${id_sesion} no encontrada en indexDB`);
        continue;
      }

      const input = {
        nro_asistentes: 0,
        nuevos: asistenciasDeSesion.map((a) => ({
          id_asistencia: a.id_asistencia ?? null,
          id_sesion: a.id_sesion ?? null,
          id_persona: a.id_persona ?? null,
        })),
        imagen: null,
        id_sesion,
        id_actividad: sesion.id_actividad ?? null,
        descripcion: null,
      };

      try {
        const resp = await firstValueFrom(
          this.graphQLService.mutation<
            Record<string, { mensaje: string; exitoso: string }>
          >(this.UPDATE_ASISTENCIAS, { input }),
        );

        const result = resp['updateAsistencias'];
        if (result?.exitoso === 'S') {
          for (const asis of asistenciasDeSesion) {
            await this.asistenciasDataSource.update(asis.id_asistencia, {
              ...asis,
              syncStatus: 'synced',
              deleted: false,
            });
          }
        } else {
          console.warn(
            `❌ Asistencias no sincronizadas (sesión ${id_sesion}):`,
            result?.mensaje,
          );
        }
      } catch (err) {
        console.error(
          `❌ Error sincronizando asistencias (sesión ${id_sesion}):`,
          err,
        );
      }
    }
  }

  // --------------------------------------------------------------------------
  // 🔹 Eliminar sesión remota
  // --------------------------------------------------------------------------

  async deleteSesion(id_sesion: string): Promise<void> {
    try {
      const resp = await firstValueFrom(
        this.graphQLService.mutation<
          Record<string, { mensaje: string; exitoso: string }>
        >(this.DELETE_SESION, { id_sesion }),
      );

      const result = resp['deleteSesion'];
      if (result?.exitoso === 'S') {
        await indexDB.sesiones.delete(id_sesion);
      } else {
        console.warn(`❌ Sesión ${id_sesion} no eliminada:`, result?.mensaje);
      }
    } catch (err) {
      console.error(`❌ Error eliminando sesión ${id_sesion}:`, err);
    }
  }

  // --------------------------------------------------------------------------
  // 🔹 Utilidades
  // --------------------------------------------------------------------------

  private async pingBackend(): Promise<boolean> {
    return await firstValueFrom(
      this.loadIndexDBService
        .ping()
        .pipe(switchMap((ping) => of(ping === 'pong'))),
    );
  }

  private toDateOnly(value: string | null | undefined): string | null {
    if (!value) return null;
    const timestamp = Number(value);
    if (Number.isNaN(timestamp)) return null;

    const d = new Date(timestamp);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
