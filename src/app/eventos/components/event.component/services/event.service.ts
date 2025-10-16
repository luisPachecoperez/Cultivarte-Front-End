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

    sedes {
      id_sede
      nombre
    }

    tiposDeActividad {
      id_tipo_actividad
      nombre
    }

    aliados {
      id_aliado
      nombre
    }

    responsables {
      id_responsable
      nombre
    }

    nombresDeActividad {
      id_tipo_actividad
      nombre
    }

    frecuencias {
      id_frecuencia
      nombre
    }

    actividad {
      id_actividad
      id_programa
      id_tipo_actividad
      id_responsable
      id_aliado
      id_sede
      id_frecuencia
      institucional
      nombre_actividad
      descripcion
      fecha_actividad
      hora_inicio
      hora_fin
      plazo_asistencia
      estado
      id_creado_por
      fecha_creacion
      id_modificado_por
      fecha_modificacion
    }

    sesiones {
      id_sesion
      fecha_actividad
      hora_inicio
      hora_fin
      nro_asistentes
      id_creado_por
      fecha_creacion
      id_modificado_por
      fecha_modificacion
    }
  }
}
`;

  private readonly GET_PRE_CREATE_ACTIVIDAD = `
    query GetPreCreateActividad($id_usuario: ID!) {
      getPreCreateActividad(id_usuario: $id_usuario) {
        id_programa

        sedes {
          id_sede
          nombre
        }

        tiposDeActividad {
          id_tipo_actividad
          nombre
        }

        aliados {
          id_aliado
          nombre
        }

        responsables {
          id_responsable
          nombre
        }
        nombresDeActividad
            {id_tipo_actividad
            nombre
            }
        frecuencias {
          id_frecuencia
          nombre
        }
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

  /**
   * 📡 Obtiene sesiones para mostrar en el calendario
   * @param fechaInicio YYYY-MM-DD
   * @param fechaFin YYYY-MM-DD
   * @param id_usuario string
   */

  /**
   * 📡 Obtiene un evento por su ID con parámetros y sesiones (Mock GraphQL)
   * @param id_actividad string
   */

  async obtenerEventoPorId(id_actividad: string): Promise<PreEditActividad> {
    this.loadingService.show(); // 🔄 mostrar
    const id_usuario = this.authService.getUserUuid();
    return await firstValueFrom(
      this.loadIndexDBService.ping().pipe(
        switchMap((ping) => {
          if (ping === 'pong') {
            return this.graphql
              .query<{ getPreEditActividad: any }>(this.GET_EVENTO, {
                id_actividad,
                id_usuario,
              })
              .pipe(
                tap((res) => {
                  console.log('📡 Respuesta cruda de GraphQL:', res);
                  this.loadingService.hide();
                }),
                map((res) => res.getPreEditActividad as PreEditActividad),
                catchError((err) => {
                  console.error(
                    '❌ Error GraphQL, usando fallback local:',
                    err,
                  );
                  this.loadingService.hide(); // 🔄 ocultar
                  return from(
                    this.actividadesDataSource.getPreEditActividad(
                      id_actividad,
                      id_usuario,
                    ),
                  );
                }),
              );
          } else {
            this.loadingService.hide(); // 🔄 ocultar
            return from(
              this.actividadesDataSource.getPreEditActividad(
                id_actividad,
                id_usuario,
              ),
            );
          }
        }), // 👈 cierre del switchMap
      ),
    );
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

                const preActividad$ = from(
                  this.actividadesDataSource.getPreCreateActividad(id_usuario),
                );
                return preActividad$;
              }),
            );
        } else {
          const preActividad$ = from(
            this.actividadesDataSource.getPreCreateActividad(id_usuario),
          );

          return preActividad$;
        }
      }), // 👈 cierre del switchMap
    );
  }

  async crearEvento(
    evento: Actividades,
    sesiones: Sesiones[],
  ): Promise<GraphQLResponse> {
    const id_usuario = this.authService.getUserUuid();

    type ActividadPayloadBackend = Omit<
      Actividades,
      'syncStatus' | 'deleted' | 'plazo_asistencia'
    >;

    const payloadBackend: ActividadPayloadBackend = { ...evento };

    // 🔹 Ajustar sesiones antes de guardar
    this.prepararSesiones(sesiones, evento.id_actividad || '', id_usuario);

    const ping = await firstValueFrom(this.loadIndexDBService.ping());

    if (ping !== 'pong') {
      // 🔸 Caso offline → guardar local
      return this.guardarEventoOffline(evento, sesiones);
    }

    // 🔹 Caso online → guardar en backend
    try {
      const res = await firstValueFrom(
        this.graphql.mutation<{ createActividad: GraphQLResponse }>(
          this.CREATE_ACTIVIDAD,
          { data: payloadBackend },
        ),
      );

      const actividadResponse = res.createActividad;
      if (actividadResponse?.exitoso !== 'S') {
        return actividadResponse;
      }

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

  /**
   * Guarda evento y sesiones en modo offline.
   */
  private guardarEventoOffline(
    evento: Actividades,
    sesiones: Sesiones[],
  ): GraphQLResponse {
    const actividad: ActividadesDB = {
      ...evento,
      syncStatus: 'pending-create',
      deleted: false,
    };
    this.actividadesDataSource.create(actividad);

    sesiones.forEach((s) => {
      const sesion: SesionesDB = {
        ...s,
        id_sesion: s.id_sesion ?? '',
        syncStatus: 'pending-create',
        deleted: false,
      };
      this.sesionesDataSource.create(sesion);
    });

    return {
      exitoso: 'S',
      mensaje: 'Registro guardado satisfactoriamente',
    };
  }

  /**
   * Guarda evento y sesiones en modo online.
   */
  private async guardarEventoOnline(
    evento: Actividades,
    sesiones: Sesiones[],
  ): Promise<void> {
    const cambios = { nuevos: sesiones, modificados: [], eliminados: [] };

    const sesionesResponse =
      await this.grid_sesionesService.guardarCambiosSesiones(cambios);

    if (sesionesResponse?.exitoso !== 'S') return;

    const actividad: ActividadesDB = {
      ...evento,
      syncStatus: 'synced',
      deleted: false,
    };
    this.actividadesDataSource.create(actividad);

    sesiones.forEach((s) => {
      const sesion: SesionesDB = {
        ...s,
        id_sesion: s.id_sesion ?? '',
        syncStatus: 'synced',
        deleted: false,
      };
      this.sesionesDataSource.create(sesion);
    });
  }
}
