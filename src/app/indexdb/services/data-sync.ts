import { Injectable } from '@angular/core';
import { interval, of, from, firstValueFrom } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { indexDB } from './database.service';
import { ActividadesDataSource } from '../datasources/actividades-datasource';
import { SesionesDataSource } from '../datasources/sesiones-datasource';
import { AsistenciasDataSource } from '../datasources/asistencias-datasource';
import { GraphQLService } from '../../shared/services/graphql.service';
import { LoadIndexDB } from './load-index-db.service';

@Injectable({ providedIn: 'root' })
export class DataSyncService {
  private readonly PING_QUERY = `
    query Ping {
      ping
    }
  `;
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
        mutation DeleteSesion($idSesion: ID!) {
          deleteSesion(id_sesion: $idSesion) {
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

  constructor(
    private http: HttpClient,
    private actividadesDataSource: ActividadesDataSource,
    private sesionesDataSource: SesionesDataSource,
    private asistenciasDataSource: AsistenciasDataSource,
    private graphQLService: GraphQLService,
    private loadIndexDB: LoadIndexDB
  ) {}

  /**
   * Inicia el proceso de sincronización en background
   */
  async startSync() {
    console.log('Inicia sincronizacion:', new Date());
    await this.syncPending();
    interval(1000 * 60)
      .pipe(switchMap(() => from(this.syncPending())))
      .subscribe();
  }

  /**
   * Revisa si hay datos pendientes y los sincroniza con el backend
   */
  private async syncPending() {
    console.log('🔍 Revisando datos pendientes en IndexedDB...');

    // 1. Verificar si backend responde
    const backendActivo = await this.pingBackend();
    console.log('resultado ping:', backendActivo, 'hora:', new Date());
    if (!backendActivo) {
      console.warn('⚠️ Backend inactivo, no se sincroniza todavía');
      return;
    }
    console.log('Backend activo inicia sincronizacion');
    //Buscar las actividades, sesiones y asistencias pendientes
    this.syncActividadesPendientes();
    this.syncSesionesPendientes();
    this.syncAsistenciasPendientes();

    const asistenciasPendientes = await indexDB.asistencias
      .filter(
        (s) =>
          s.syncStatus === 'pending-create' ||
          s.syncStatus === 'pending-update' ||
          s.deleted === true
      )
      .toArray();
  }

  async syncActividadesPendientes() {
    const actividadesPendientes = await indexDB.actividades
      .filter(
        (s) =>
          s.syncStatus === 'pending-create' ||
          s.syncStatus === 'pending-update' ||
          s.deleted === true
      )
      .toArray();

    console.log('Actividades pendientes: ', actividadesPendientes);
    for (const act of actividadesPendientes) {
      await this.crearActividades(act.id_actividad);
    }
  }
  async crearActividades(id_actividad: string): Promise<void> {
    // 1. Traer la actividad desde indexDB
    const actividad = await indexDB.actividades.get(id_actividad);
    if (!actividad) {
      console.warn(`⚠️ Actividad ${id_actividad} no encontrada en indexDB`);
      return;
    }

    // 2. Armar el input según el contrato GraphQL
    const input = {
      plazo_asistencia: actividad.plazo_asistencia ?? null,
      nombre_actividad: actividad.nombre_actividad ?? null,
      institucional: actividad.institucional ?? null,
      id_tipo_actividad: actividad.id_tipo_actividad ?? null,
      id_sede: actividad.id_sede ?? null,
      id_responsable: actividad.id_responsable ?? null,
      id_programa: actividad.id_programa ?? null,
      id_modificado_por: actividad.id_modificado_por ?? null,
      id_frecuencia: actividad.id_frecuencia ?? null,
      id_creado_por: actividad.id_creado_por ?? null,
      id_aliado: actividad.id_aliado ?? null,
      id_actividad: actividad.id_actividad ?? null,
      hora_inicio: actividad.hora_inicio ?? null,
      hora_fin: actividad.hora_fin ?? null,

      // 🔹 fechas convertidas a YYYY-MM-DD
      fecha_modificacion: this.toDateOnly(actividad.fecha_modificacion),
      fecha_creacion: this.toDateOnly(actividad.fecha_creacion),
      fecha_actividad: this.toDateOnly(actividad.fecha_actividad),

      estado: actividad.estado ?? null,
      descripcion: actividad.descripcion ?? null,
    };

    console.log('Actividad a crear:', input);
    try {
      // 3. Ejecutar GraphQL usando el servicio centralizado
      const resp = await firstValueFrom(
        this.graphQLService.mutation<{
          createActividad: { mensaje: string; exitoso: string };
        }>(this.CREATE_ACTIVIDAD, { data: input })
      );

      const result = resp.createActividad;
      console.log(`📤 Respuesta createActividad (${id_actividad}):`, result);

      // 4. Si fue exitoso → actualizar en indexDB
      if (result.exitoso === 'S') {
        await this.actividadesDataSource.update(id_actividad, {
          ...actividad,
          syncStatus: 'synced',
          deleted: false,
        });
        console.log(`✅ Actividad ${id_actividad} sincronizada`);
      } else {
        console.warn(
          `❌ Actividad ${id_actividad} no sincronizada:`,
          result.mensaje
        );
      }
    } catch (err) {
      console.error(`❌ Error creando actividad ${id_actividad}:`, err);
    }
  }

  async syncSesionesPendientes() {
    const sesionesPendientes = await indexDB.sesiones
      .filter(
        (s) =>
          s.syncStatus === 'pending-create' ||
          s.syncStatus === 'pending-update' ||
          s.deleted === true
      )
      .toArray();
    for (const ses of sesionesPendientes) {
      if (ses.deleted === true) {
        await this.sesionesDataSource.update(ses.id_sesion, {
          ...ses,
          syncStatus: 'pending-delete',
        });
        ses.syncStatus = 'pending-delete'; // para que siga en el flujo
      }
    }

    console.log('Sesiones pendientes: ', sesionesPendientes);
    for (const ses of sesionesPendientes) {
      switch (ses.syncStatus) {
        case 'pending-create':
          await this.crearSesiones(ses.id_sesion);
          break;

        case 'pending-update':
          await this.updateSesiones(ses.id_sesion);
          break;

        case 'pending-delete':
          await this.deleteSesion(ses.id_sesion);
          break;

        default:
          console.log(
            `⚠️ Sesión ${ses.id_sesion} con syncStatus desconocido: ${ses.syncStatus}`
          );
      }
    }
  }
  async crearSesiones(id_sesion: string): Promise<void> {
    // 1. Traer la sesión desde indexDB
    const sesion = await indexDB.sesiones.get(id_sesion);
    if (!sesion) {
      console.warn(`⚠️ Sesión ${id_sesion} no encontrada en indexDB`);
      return;
    }

    // 2. Armar el input según el contrato GraphQL
    const input = {
      nro_asistentes: sesion.nro_asistentes ?? null,
      imagen: sesion.imagen ?? null,
      id_sesion: sesion.id_sesion ?? null,
      id_modificado_por: sesion.id_modificado_por ?? null,
      id_creado_por: sesion.id_creado_por ?? null,
      id_actividad: sesion.id_actividad ?? null,
      hora_inicio: sesion.hora_inicio ?? null,
      hora_fin: sesion.hora_fin ?? null,

      // 🔹 fechas convertidas a YYYY-MM-DD
      fecha_modificacion: this.toDateOnly(sesion.fecha_modificacion),
      fecha_creacion: this.toDateOnly(sesion.fecha_creacion),
      fecha_actividad: this.toDateOnly(sesion.fecha_actividad),

      descripcion: sesion.descripcion ?? null,
    };

    console.log('Sesión a crear:', input);

    try {
      // 3. Ejecutar GraphQL usando el servicio centralizado
      const resp = await firstValueFrom(
        this.graphQLService.mutation<{
          createSesion: { mensaje: string; exitoso: string };
        }>(this.CREATE_SESION, { input })
      );

      const result = resp.createSesion;
      console.log(`📤 Respuesta createSesion (${id_sesion}):`, result);

      // 4. Si fue exitoso → actualizar en indexDB
      if (result.exitoso === 'S') {
        await this.sesionesDataSource.update(id_sesion, {
          ...sesion,
          syncStatus: 'synced',
          deleted: false,
        });
        console.log(`✅ Sesión ${id_sesion} sincronizada`);
      } else {
        console.warn(`❌ Sesión ${id_sesion} no sincronizada:`, result.mensaje);
      }
    } catch (err) {
      console.error(`❌ Error creando sesión ${id_sesion}:`, err);
    }
  }

  async updateSesiones(id_sesion: string): Promise<void> {
    // 1. Traer la sesión desde indexDB
    const sesion = await indexDB.sesiones.get(id_sesion);
    if (!sesion) {
      console.warn(`⚠️ Sesión ${id_sesion} no encontrada en indexDB`);
      return;
    }

    // 2. Armar el input según el contrato GraphQL
    const input = {
      nro_asistentes: sesion.nro_asistentes ?? null,
      imagen: sesion.imagen ?? null,
      id_sesion: sesion.id_sesion ?? null,
      id_modificado_por: sesion.id_modificado_por ?? null,
      id_creado_por: sesion.id_creado_por ?? null,
      id_actividad: sesion.id_actividad ?? null,
      hora_inicio: sesion.hora_inicio ?? null,
      hora_fin: sesion.hora_fin ?? null,

      // 🔹 fechas convertidas a YYYY-MM-DD
      fecha_modificacion: this.toDateOnly(sesion.fecha_modificacion),
      fecha_creacion: this.toDateOnly(sesion.fecha_creacion),
      fecha_actividad: this.toDateOnly(sesion.fecha_actividad),

      descripcion: sesion.descripcion ?? null,
    };

    console.log('Sesión a actualizar:', input);

    try {
      // 3. Ejecutar GraphQL usando el servicio centralizado
      const resp = await firstValueFrom(
        this.graphQLService.mutation<{
          updateSesion: { mensaje: string; exitoso: string };
        }>(this.UPDATE_SESION, { input })
      );

      const result = resp.updateSesion;
      console.log(`📤 Respuesta updateSesion (${id_sesion}):`, result);

      // 4. Si fue exitoso → actualizar en indexDB
      if (result.exitoso === 'S') {
        await this.sesionesDataSource.update(id_sesion, {
          ...sesion,
          syncStatus: 'synced',
          deleted: false,
        });
        console.log(`✅ Sesión ${id_sesion} actualizada y sincronizada`);
      } else {
        console.warn(`❌ Sesión ${id_sesion} no sincronizada:`, result.mensaje);
      }
    } catch (err) {
      console.error(`❌ Error actualizando sesión ${id_sesion}:`, err);
    }
  }

  async syncAsistenciasPendientes(): Promise<void> {
    const asistenciasPendientes = await indexDB.asistencias
      .filter(
        (s) =>
          s.syncStatus === 'pending-create' ||
          s.syncStatus === 'pending-update' ||
          s.deleted === true
      )
      .toArray();

    if (asistenciasPendientes.length === 0) {
      console.log('✅ No hay asistencias pendientes');
      return;
    }

    console.log('Asistencias pendientes:', asistenciasPendientes);

    // 🔹 Agrupar por id_sesion
    const grupos = asistenciasPendientes.reduce((map, asis) => {
      if (!asis.id_sesion) return map; // skip si no tiene sesión
      if (!map.has(asis.id_sesion)) {
        map.set(asis.id_sesion, []);
      }
      map.get(asis.id_sesion)!.push(asis);
      return map;
    }, new Map<string, typeof asistenciasPendientes>());

    // 🔹 Procesar cada grupo
    for (const [idSesion, asistenciasDeSesion] of grupos.entries()) {
      const sesion = await indexDB.sesiones.get(idSesion);
      if (!sesion) {
        console.warn(`⚠️ Sesión ${idSesion} no encontrada en indexDB`);
        continue;
      }

      const input = {
        numero_asistentes: 0,
        nuevos: asistenciasDeSesion.map((a) => ({
          id_asistencia: a.id_asistencia ?? null,
          id_sesion: a.id_sesion ?? null,
          id_persona: a.id_persona ?? null,
        })),
        imagen: null,
        id_sesion: idSesion,
        id_actividad: sesion.id_actividad ?? null,
        descripcion: null,
      };

      console.log(`📤 Payload UpdateAsistencias (sesión ${idSesion}):`, input);

      try {
        const resp = await firstValueFrom(
          this.graphQLService.mutation<{
            updateAsistencias: { mensaje: string; exitoso: string };
          }>(this.UPDATE_ASISTENCIAS, { input })
        );

        const result = resp.updateAsistencias;
        console.log(
          `📥 Respuesta updateAsistencias (sesión ${idSesion}):`,
          result
        );

        if (result.exitoso === 'S') {
          for (const asis of asistenciasDeSesion) {
            await this.asistenciasDataSource.update(asis.id_asistencia, {
              ...asis,
              syncStatus: 'synced',
              deleted: false,
            });
          }
          console.log(
            `✅ ${asistenciasDeSesion.length} asistencias sincronizadas (sesión ${idSesion})`
          );
        } else {
          console.warn(
            `❌ Asistencias no sincronizadas (sesión ${idSesion}):`,
            result.mensaje
          );
        }
      } catch (err) {
        console.error(
          `❌ Error sincronizando asistencias (sesión ${idSesion}):`,
          err
        );
      }
    }
  }

  async deleteSesion(id_sesion: string): Promise<void> {
    try {
      // 1. Ejecutar GraphQL usando el servicio centralizado
      const resp = await firstValueFrom(
        this.graphQLService.mutation<{
          deleteSesion: { mensaje: string; exitoso: string };
        }>(this.DELETE_SESION, { idSesion: id_sesion })
      );

      const result = resp.deleteSesion;
      console.log(`📤 Respuesta deleteSesion (${id_sesion}):`, result);

      // 2. Si fue exitoso → eliminar de indexDB
      if (result.exitoso === 'S') {
        await indexDB.sesiones.delete(id_sesion);
        console.log(`🗑️ Sesión ${id_sesion} eliminada en indexDB y backend`);
      } else {
        console.warn(`❌ Sesión ${id_sesion} no eliminada:`, result.mensaje);
      }
    } catch (err) {
      console.error(`❌ Error eliminando sesión ${id_sesion}:`, err);
    }
  }

  /**
   * Verifica si el backend está activo
   */
  private async pingBackend(): Promise<boolean> {
    return await firstValueFrom(
      this.loadIndexDB.ping().pipe(
        switchMap((ping) => {
          console.log('ping en update sesiones:', ping);
          return of(ping === 'pong'); // 👈 devolvemos un observable de boolean
        })
      )
    );
  }
  private toDateOnly(value: string | null | undefined): string | null {
    if (!value) return null;

    const timestamp = Number(value);
    if (isNaN(timestamp)) return null;

    const d = new Date(timestamp);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`; // 👉 siempre será la fecha en UTC
  }
}
