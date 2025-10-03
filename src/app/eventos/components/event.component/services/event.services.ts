import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { from } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { switchMap } from 'rxjs/operators';
import { GraphQLService } from '../../../../shared/services/graphql.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { ActividadesDataSource } from '../../../../indexdb/datasources/actividades-datasource';
import { ActividadesDB } from '../../../../indexdb/interfaces/actividades.interface';
import { GraphQLResponse } from '../../../../shared/interfaces/graphql-response.interface';
import { SesionesDataSource } from '../../../../indexdb/datasources/sesiones-datasource';
import { PreCreateActividad } from '../../../interfaces/pre-create-actividad.interface';
import { Grid_sesionesService } from '../../grid-sesiones.component/services/grid-sesiones.services';

import { Sesiones } from '../../../interfaces/sesiones.interface';

import { Actividades } from '../../../interfaces/actividades.interface';
import { LoadIndexDBService } from '../../../../indexdb/services/load-index-db.service';
import { inject } from '@angular/core';
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
  private http = inject(HttpClient);
  private graphql = inject(GraphQLService);
  private authService = inject(AuthService);
  private actividadesDataSource = inject(ActividadesDataSource);
  private sesionesDataSource = inject(SesionesDataSource);
  private grid_sesionesService = inject(Grid_sesionesService);
  private loadIndexDBService = inject(LoadIndexDBService);
  private loadingService = inject(LoadingService);
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
    //console.log(`📡 Mock GraphQL → Buscando evento con ID: ${id_actividad}`);
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
    //console.log('📡 Solicitando configuración de evento para usuario:',id_usuario);
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
                console.log('📡 Respuesta cruda de GraphQL:', res);
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
                this.loadingService.hide(); // 🔄 ocultar
                return preActividad$;
              }),
            );
        } else {
          const preActividad$ = from(
            this.actividadesDataSource.getPreCreateActividad(id_usuario),
          );
          this.loadingService.hide(); // 🔄 ocultar

          return preActividad$;
        }
      }), // 👈 cierre del switchMap
    );
  }

  async crearEvento(
    evento: Actividades,
    sesiones: Sesiones[],
  ): Promise<GraphQLResponse> {
    console.log('📤 Enviando evento al back:', evento);
    const id_usuario = this.authService.getUserUuid();

    // 🔹 Construcción del payload de la actividad
    type ActividadPayloadBackend = Omit<
      Actividades,
      'syncStatus' | 'deleted' | 'plazo_asistencia'
    >;

    const payloadBackend: ActividadPayloadBackend = {
      ...evento,
    };

    //console.log('📤 Enviando actividad al back:', payloadBackend);

    // Ajustar las sesiones
    sesiones.forEach((s: Sesiones) => {
      s.id_actividad = evento.id_actividad || '';
      s.id_creado_por = id_usuario;
      s.fecha_creacion = new Date().toISOString().split('T')[0];
    });
    return await firstValueFrom(
      this.loadIndexDBService.ping().pipe(
        switchMap((ping) => {
          if (ping === 'pong') {
            //console.log('✅ Crear evento Backend activo');
            return this.graphql
              .mutation<{
                createActividad: GraphQLResponse;
              }>(this.CREATE_ACTIVIDAD, { data: payloadBackend })
              .pipe(
                switchMap((res) => {
                  const actividadResponse = res.createActividad;
                  //console.log('Despues de llamado a backend de actividad: ',actividadResponse);
                  // guardar actividad en indexdb

                  if (actividadResponse?.exitoso === 'S') {
                    // 👇 envolvemos la llamada async en from()

                    const Sesiones = {
                      nuevos: sesiones,
                      modificados: [],
                      eliminados: [],
                    };

                    return from(
                      this.grid_sesionesService.guardarCambiosSesiones(
                        Sesiones,
                      ),
                    ).pipe(
                      tap((sesionesResponse) => {
                        if (sesionesResponse?.exitoso === 'S') {
                          const actividad: ActividadesDB = {
                            ...evento,
                            syncStatus: 'synced',
                            deleted: false,
                          };
                          this.actividadesDataSource.create(actividad);

                          sesiones.forEach((s: Sesiones) => {
                            const sesion: SesionesDB = {
                              ...s,
                              id_sesion: s.id_sesion ?? '',
                              syncStatus: 'synced',
                              deleted: false,
                            };
                            this.sesionesDataSource.create(sesion);
                          });
                        }
                      }),
                      map(() => actividadResponse),
                    );
                  }

                  return of(actividadResponse);
                }),
                catchError((err) => {
                  console.error(
                    '❌ Error al crear en GraphQL, usando solo IndexDB:',
                    err,
                  );
                  return of({
                    exitoso: 'N',
                    mensaje:
                      'Se presenta error técnico al guardar las sesiones',
                  });
                }),
              );
          } else {
            //console.log('Crear evento backend inactivo');
            // Guardar en IndexDB como pendiente
            const actividad: ActividadesDB = {
              ...evento,
              syncStatus: 'pending-create',
              deleted: false,
            };
            this.actividadesDataSource.create(actividad);

            sesiones.forEach((s: Sesiones) => {
              const sesion: SesionesDB = {
                ...s,
                id_sesion: s.id_sesion ?? '',
                syncStatus: 'pending-create',
                deleted: false,
              };
              this.sesionesDataSource.create(sesion);
            });

            return of({
              exitoso: 'S',
              mensaje: 'Registro guardado satisfactoriamente',
            });
          }
        }), // 👈 cierre del switchMap
      ),
    );
  }
}
