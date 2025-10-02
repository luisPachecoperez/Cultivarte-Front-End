import { Injectable } from '@angular/core';

import {
  firstValueFrom,
  map,
  mergeMap,
  from,
  switchMap,
  of,
  catchError,
  tap,
} from 'rxjs';
import { LoadIndexDBService } from '../../../indexdb/services/load-index-db.service';
import { ActividadesDataSource } from '../../../indexdb/datasources/actividades-datasource';
import { PreAsistencia } from '../../interfaces/pre-asistencia.interface';
import { Asistencias } from '../../interfaces/asistencia.interface';
import { Sesiones } from '../../../eventos/interfaces/sesiones.interface';
import { AsistenciasDataSource } from '../../../indexdb/datasources/asistencias-datasource';
import { SesionesDataSource } from '../../../indexdb/datasources/sesiones-datasource';
import { GraphQLResponse } from '../../../shared/interfaces/graphql-response.interface';
import { inject } from '@angular/core';
import { GraphQLService } from '../../../shared/services/graphql.service';
import { LoadingService } from '../../../shared/services/loading.service';
import { AsistenciaPayLoad } from '../../interfaces/asistencia-payload.interface';
import { AsistenciasDB } from '../../../indexdb/interfaces/asistencias.interface';
export interface AsistenciaInput {
  id_actividad: string;
  id_sesion: string;
  imagen: string;
  nro_asistentes: number;
  descripcion: string;
  nuevos: { id_persona: string; id_sesion: string; id_asistencia: string }[];
}

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private readonly UPDATE_ASISTENCIAS = `
    mutation UpdateAsistencias($input: UpdateAsistenciaInput!) {
      updateAsistencias(input: $input) {
        exitoso
        mensaje
      }
    }
    `;
  private readonly GET_PRE_ASISTENCIA = `
  query GetPreAsistencia($id_sesion: ID!) {
    getPreAsistencia(id_sesion: $id_sesion) {
      id_sesion
      id_sede
      numero_asistentes
      foto
      descripcion
      imagen

      sedes {
        id_sede
        nombre
      }

      beneficiarios {
        id_persona
        nombre_completo
        id_sede
        identificacion
      }

      asistentes_sesiones {
        id_persona
        eliminar
      }
    }
  }
`;
  private readonly ACTUALIZAR_SESION = `
mutation updateAsistencias($input: UpdateSesionInput!) {
  updateAsistencias(input: $input) {
    exitoso
    mensaje
  }
}
`;
  private actividadesDataSource = inject(ActividadesDataSource);
  private loadIndexDBService = inject(LoadIndexDBService);
  private asistenciasDataSource = inject(AsistenciasDataSource);
  private sesionesDataSource = inject(SesionesDataSource);
  private graphQLService = inject(GraphQLService);
  private LoadingService = inject(LoadingService);
  constructor() {}

  // 🔹 Consultar info de asistencia según id_actividad
  async obtenerDetalleAsistencia(id_sesion: string): Promise<PreAsistencia> {
    this.LoadingService.show();
    return <PreAsistencia>await firstValueFrom(
      this.loadIndexDBService.ping().pipe(
        switchMap((ping) => {
          //console.log('ping en update sesiones:', ping);

          if (ping === 'pong') {
            //console.log('Update sesiones backend activo');

            return this.graphQLService
              .query<{ getPreAsistencia: any }>(this.GET_PRE_ASISTENCIA, {
                id_sesion,
              })
              .pipe(
                map((res) => {
                  //console.log('👉 preAsistencia desde backend:', res);
                  this.LoadingService.hide();
                  return <PreAsistencia>res.getPreAsistencia;
                }),
              );
          } else {
            //console.log("Se fue por el else");
            return from(
              this.actividadesDataSource.getPreAsistencia(id_sesion),
            ).pipe(
              tap(() => {
                //console.log('👉 preAsistencia calculada (offline):', preAsistencia);
                this.LoadingService.hide();
              }),
            );
          }
        }),
      ),
    );
  }

  async guardarAsistencia(input: AsistenciaPayLoad): Promise<GraphQLResponse> {
    this.LoadingService.show();

    return await firstValueFrom(
      this.loadIndexDBService.ping().pipe(
        switchMap((ping) => {
          //console.log('ping en update asistencias:', ping);

          if (ping === 'pong') {
            //console.log('✅ Backend activo: enviando asistencias');

            return this.graphQLService
              .mutation<{
                updateAsistencias: { exitoso: string; mensaje: string };
              }>(this.UPDATE_ASISTENCIAS, { input })
              .pipe(
                map((res) => {
                  const result = res.updateAsistencias;
                  //console.log('✅ updateAsistencias OK:', result);

                  // Nuevas -> synced
                  input.nuevos.forEach((a: Asistencias) => {
                    const asistencia: AsistenciasDB = {
                      ...a,
                      syncStatus: 'synced',
                      deleted: false,
                    };
                    this.asistenciasDataSource.create(asistencia);
                  });
                  this.LoadingService.hide();

                  return result;
                }),
                catchError((error) => {
                  console.error('❌ Error en updateAsistencias:', error);

                  this.LoadingService.hide();

                  return of({
                    exitoso: 'N',
                    mensaje: 'Error guardando asistencias:' + error,
                  });
                }),
              );
          } else {
            //console.log('⚠️ Backend inactivo: guardando offline');

            // Nuevas -> pending
            input.nuevos.forEach((a: Asistencias) => {
              const asistencia: AsistenciasDB = {
                ...a,
                syncStatus: 'pending-create',
                deleted: false,
              };

              this.asistenciasDataSource.create(asistencia);
            });
            this.LoadingService.hide();

            return of({
              exitoso: 'S',
              mensaje: 'Asistencias guardadas satisfactoriamente (offline)',
            });
          }
        }),
      ),
    );
  }

  async guardarAsistenciaFotografica(
    input: Sesiones,
  ): Promise<GraphQLResponse> {
    //console.log('Evidencia fotográfica:', input);

    return await firstValueFrom(
      this.loadIndexDBService.ping().pipe(
        switchMap((ping) => {
          if (ping === 'pong') {
            // 🔹 Llamada al backend
            return this.graphQLService
              .mutation<{
                updateAsistencias: GraphQLResponse;
              }>(this.UPDATE_ASISTENCIAS, { input })
              .pipe(
                mergeMap((res) =>
                  from(this.sesionesDataSource.getById(input.id_sesion)).pipe(
                    mergeMap((sesion) =>
                      from(
                        this.sesionesDataSource.update(input.id_sesion, {
                          ...sesion,
                          syncStatus: 'synced',
                          deleted: false,
                          imagen: input.imagen ?? '',
                          descripcion: input.descripcion,
                          nro_asistentes: input.nro_asistentes ?? 0, // 👈 corregido
                        }),
                      ).pipe(
                        map(() => {
                          //console.log('📥 Sesión actualizada en IndexedDB (synced)');
                          return res.updateAsistencias;
                        }),
                      ),
                    ),
                  ),
                ),
              );
          } else {
            // 🔹 Guardar solo en IndexedDB (offline)
            return from(
              this.sesionesDataSource.getById(input.id_sesion ?? ''),
            ).pipe(
              mergeMap((sesion) =>
                from(
                  this.sesionesDataSource.update(input.id_sesion ?? '', {
                    ...sesion,
                    syncStatus: 'pending-update',
                    deleted: false,
                    imagen: input.imagen ?? '',
                    descripcion: input.descripcion,
                    nro_asistentes: input.nro_asistentes, // 👈 corregido
                  }),
                ).pipe(
                  map(() => {
                    //console.log('⚠️ Asistencia marcada como pendiente');
                    return {
                      exitoso: 'S',
                      mensaje: 'Asistencia actualizada correctamente (offline)',
                    } as GraphQLResponse;
                  }),
                ),
              ),
            );
          }
        }),
      ),
    );
  }
}
