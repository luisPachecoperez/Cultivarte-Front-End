import { Injectable, inject } from '@angular/core';
import { Observable, from, firstValueFrom } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { GraphQLService } from '../../../../shared/services/graphql.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { ActividadesDataSource } from '../../../../indexdb/datasources/actividades-datasource';
import { ActividadesDB } from '../../../../indexdb/interfaces/actividades.interface';
import { GraphQLResponse } from '../../../../shared/interfaces/graphql-response.interface';
import { SesionesDataSource } from '../../../../indexdb/datasources/sesiones-datasource';
import { PreCreateActividad } from '../../../interfaces/pre-create-actividad.interface';
import { GridSesionesService } from '../../grid-sesiones.component/services/grid-sesiones.service';
import { Sesiones } from '../../../interfaces/sesiones.interface';
import { Actividades } from '../../../interfaces/actividades.interface';
import { LoadIndexDBService } from '../../../../indexdb/services/load-index-db.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { PreEditActividad } from '../../../interfaces/pre-edit-actividad.interface';
import { SesionesDB } from '../../../../indexdb/interfaces/sesiones.interface';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private readonly CREATE_ACTIVIDAD = `
    mutation CreateActividad($data: ActividadInput!) {
      createActividad(data: $data) {
        exitoso
        mensaje
      }
    }
  `;

  private readonly GET_EVENTO = `
    query GetPreEditActividad($id_actividad: ID!, $id_usuario: ID!) {
      getPreEditActividad(id_actividad: $id_actividad, id_usuario: $id_usuario) {
        id_programa
        sedes { id_sede nombre }
        tiposDeActividad { id_tipo_actividad nombre }
        aliados { id_aliado nombre }
        responsables { id_responsable nombre }
        nombresDeActividad { id_tipo_actividad nombre }
        frecuencias { id_frecuencia nombre }
        actividad {
          id_actividad id_programa id_tipo_actividad id_responsable id_aliado
          id_sede id_frecuencia institucional nombre_actividad descripcion
          fecha_actividad hora_inicio hora_fin plazo_asistencia estado
          id_creado_por fecha_creacion id_modificado_por fecha_modificacion
        }
        sesiones {
          id_sesion fecha_actividad hora_inicio hora_fin nro_asistentes
          id_creado_por fecha_creacion id_modificado_por fecha_modificacion
        }
      }
    }
  `;

  private readonly GET_PRE_CREATE_ACTIVIDAD = `
    query GetPreCreateActividad($id_usuario: ID!) {
      getPreCreateActividad(id_usuario: $id_usuario) {
        id_programa
        sedes { id_sede nombre }
        tiposDeActividad { id_tipo_actividad nombre }
        aliados { id_aliado nombre }
        responsables { id_responsable nombre }
        nombresDeActividad { id_tipo_actividad nombre }
        frecuencias { id_frecuencia nombre }
      }
    }
  `;

  private readonly http = inject(HttpClient);
  private readonly graphql = inject(GraphQLService);
  private readonly authService = inject(AuthService);
  private readonly actividadesDataSource = inject(ActividadesDataSource);
  private readonly sesionesDataSource = inject(SesionesDataSource);
  private readonly grid_sesionesService = inject(GridSesionesService);
  private readonly loadIndexDBService = inject(LoadIndexDBService);
  private readonly loadingService = inject(LoadingService);

  constructor() {}

  // ============================================================
  // 🔹 Métodos públicos
  // ============================================================

  async obtenerEventoPorId(id_actividad: string): Promise<PreEditActividad> {
    const id_usuario = this.authService.getUserUuid();

    this.loadingService.show(); // 🔄 mostrar

    return this.consultarConFallback<PreEditActividad>({
      graphqlCall: () =>
        this.graphql.query<{ getPreEditActividad: PreEditActividad }>(
          this.GET_EVENTO,
          { id_actividad, id_usuario },
        ),
      localFallback: () =>
        this.actividadesDataSource.getPreEditActividad(
          id_actividad,
          id_usuario,
        ),
      mapResponse: (res) =>
        (res as { getPreEditActividad: PreEditActividad }).getPreEditActividad,
      errorContext: 'Error GraphQL, usando fallback local:',
    });
  }

  obtenerConfiguracionEvento(
    id_usuario: string,
  ): Observable<PreCreateActividad> {
    this.loadingService.show(); // 🔄 mostrar

    return this.loadIndexDBService.ping().pipe(
      switchMap((ping) => {
        if (ping === 'pong') {
          return this.graphql
            .query<{
              getPreCreateActividad: PreCreateActividad;
            }>(this.GET_PRE_CREATE_ACTIVIDAD, { id_usuario })
            .pipe(
              map((res) => {
                this.loadingService.hide(); // 🔄 ocultar
                return res.getPreCreateActividad;
              }),
              catchError((err) => {
                console.error(
                  '❌ Error al consultar configuración de evento por GraphQL, usando fallback local:',
                  err,
                );
                return from(
                  this.actividadesDataSource.getPreCreateActividad(id_usuario),
                );
              }),
            );
        }
        return from(
          this.actividadesDataSource.getPreCreateActividad(id_usuario),
        );
      }),
    );
  }

  async crearEvento(
    evento: Actividades,
    sesiones: Sesiones[],
  ): Promise<GraphQLResponse> {
    const id_usuario = this.authService.getUserUuid();

    const payloadBackend: Omit<
      Actividades,
      'syncStatus' | 'deleted' | 'plazo_asistencia'
    > = {
      ...evento,
    };

    this.prepararSesiones(sesiones, evento.id_actividad || '', id_usuario);

    const ping = await firstValueFrom(this.loadIndexDBService.ping());
    if (ping !== 'pong') return this.guardarEventoOffline(evento, sesiones);
    console.log('📡 Creando evento en GraphQL:', payloadBackend, sesiones);
    try {
      const res = await firstValueFrom(
        this.graphql.mutation<{ createActividad: GraphQLResponse }>(
          this.CREATE_ACTIVIDAD,
          { data: payloadBackend },
        ),
      );

      const actividadResponse = res.createActividad;
      if (actividadResponse?.exitoso !== 'S') return actividadResponse;
      console.log(
        '✅ Evento creado en GraphQL, guardando sesiones...',
        evento,
        sesiones,
      );
      await this.guardarEventoOnline(evento, sesiones);
      return actividadResponse;
    } catch (err) {
      console.error('❌ Error al crear en GraphQL:', err);
      return {
        exitoso: 'N',
        mensaje: 'Se presenta error técnico al guardar las sesiones',
      };
    }
  }

  // ============================================================
  // 🔹 Métodos privados reutilizables
  // ============================================================

  private prepararSesiones(
    sesiones: Sesiones[],
    id_actividad: string,
    id_usuario: string,
  ): void {
    const fecha = new Date().toISOString().split('T')[0];
    sesiones.forEach((s) => {
      s.id_actividad = id_actividad;
      s.id_creado_por = id_usuario;
      s.fecha_creacion = fecha;
    });
  }

  private crearActividadLocal(
    evento: Actividades,
    syncStatus: string,
  ): ActividadesDB {
    return {
      ...evento,
      nombre_actividad: evento.nombre_actividad ?? '',
      descripcion: evento.descripcion ?? '',
      fecha_actividad: evento.fecha_actividad ?? '',
      syncStatus,
      deleted: false,
    };
  }

  private crearSesionLocal(s: Sesiones, syncStatus: string): SesionesDB {
    return {
      ...s,
      id_sesion: s.id_sesion ?? '',
      syncStatus,
      deleted: false,
    };
  }

  private guardarEventoOffline(
    evento: Actividades,
    sesiones: Sesiones[],
  ): GraphQLResponse {
    this.actividadesDataSource.create(
      this.crearActividadLocal(evento, 'pending-create'),
    );
    sesiones.forEach(
      (s) =>
        void this.sesionesDataSource.create(
          this.crearSesionLocal(s, 'pending-create'),
        ),
    );

    return { exitoso: 'S', mensaje: 'Registro guardado satisfactoriamente' };
  }

  private async guardarEventoOnline(
    evento: Actividades,
    sesiones: Sesiones[],
  ): Promise<void> {
    const cambios = {
      sesiones: { nuevos: sesiones, modificados: [], eliminados: [] },
    };
    console.log('📡 Guardando sesiones en GraphQL cambios:', cambios);
    const sesionesResponse =
      await this.grid_sesionesService.guardarCambiosSesiones(cambios);

    if (sesionesResponse?.exitoso !== 'S') return;

    this.actividadesDataSource.create(
      this.crearActividadLocal(evento, 'synced'),
    );
    sesiones.forEach(
      (s) =>
        void this.sesionesDataSource.create(this.crearSesionLocal(s, 'synced')),
    );
  }

  private consultarConFallback<T>({
    graphqlCall,
    localFallback,
    mapResponse,
    errorContext,
  }: {
    graphqlCall: () => Observable<unknown>;
    localFallback: () => Promise<T>;
    mapResponse: (res: unknown) => T;
    errorContext: string;
  }): Promise<T> {
    return firstValueFrom(
      this.loadIndexDBService.ping().pipe(
        switchMap((ping) => {
          if (ping === 'pong') {
            return graphqlCall().pipe(
              tap((res) => {
                console.log('📡 Respuesta cruda de GraphQL:', res);
                this.loadingService.hide();
              }),
              map(mapResponse),
              catchError((): Observable<T> => {
                console.error(`❌ ${errorContext}`);
                this.loadingService.hide();
                return from(localFallback());
              }),
            );
          }
          this.loadingService.hide();
          return from(localFallback());
        }),
      ),
    );
  }
}
