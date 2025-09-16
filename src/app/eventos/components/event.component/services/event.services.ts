import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import { v4 as uuidv4 } from 'uuid';

import { from } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { switchMap } from 'rxjs/operators';
import { GraphQLService } from '../../../../shared/services/graphql.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { ActividadesDataSource } from '../../../../indexdb/datasources/actividades-datasource';
import { GraphQLResponse } from '../../../../shared/interfaces/graphql-response.interface';
import { SesionesDataSource } from '../../../../indexdb/datasources/sesiones-datasource';
import { PreCreateActividad } from '../../../../shared/interfaces/pre-create-actividad.interface';
import { GridSesionesService } from '../../grid-sesiones.component/services/grid-sesiones.services';
import { Sesiones } from '../../../../indexdb/interfaces/sesiones.interface';
import { Actividades } from '../../../../indexdb/interfaces/actividades.interface';
import { LoadIndexDBService } from '../../../../indexdb/services/load-index-db.service';
import { inject } from '@angular/core';
import { LoadingService } from '../../../../shared/services/loading.service';
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
  private gridSesionesService = inject(GridSesionesService);
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

  async obtenerEventoPorId(id_actividad: string): Promise<any> {
    this.loadingService.show(); // 🔄 mostrar
    const id_usuario = this.authService.getUserUuid();
    console.log(`📡 Mock GraphQL → Buscando evento con ID: ${id_actividad}`);
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
                map((res) => res.getPreEditActividad),
                catchError((err) => {
                  console.error(
                    '❌ Error GraphQL, usando fallback local:',
                    err
                  );
                  this.loadingService.hide(); // 🔄 ocultar
                  return from(
                    this.actividadesDataSource.getPreEditActividad(
                      id_actividad,
                      id_usuario
                    )
                  );
                })
              );
          } else {
            this.loadingService.hide(); // 🔄 ocultar
            return from(
              this.actividadesDataSource.getPreEditActividad(
                id_actividad,
                id_usuario
              )
            );
          }
        }) // 👈 cierre del switchMap
      )
    );
  }

  obtenerConfiguracionEvento(id_usuario: string): Observable<any> {
    this.loadingService.show(); // 🔄 mostrar
    console.log(
      '📡 Solicitando configuración de evento para usuario:',
      id_usuario
    );
    return this.loadIndexDBService.ping().pipe(
      switchMap((ping) => {
        if (ping === 'pong') {
          return this.graphql
            .query<{ getPreCreateActividad: PreCreateActividad }>(
              this.GET_PRE_CREATE_ACTIVIDAD,
              { id_usuario }
            )
            .pipe(
              map((res) => {
                this.loadingService.hide(); // 🔄 ocultar

                res.getPreCreateActividad;
              }),
              catchError((err) => {
                console.error(
                  '❌ Error al consultar configuración de evento por GraphQL, usando fallback local:',
                  err
                );

                const preActividad$ = from(
                  this.actividadesDataSource.getPreCreateActividad(id_usuario)
                );
                this.loadingService.hide(); // 🔄 ocultar
                return preActividad$;
              })
            );
        } else {
          const preActividad$ = from(
            this.actividadesDataSource.getPreCreateActividad(id_usuario)
          );
          this.loadingService.hide(); // 🔄 ocultar

          return preActividad$;
        }
      }) // 👈 cierre del switchMap
    );
  }

  async crearEvento(
    evento: any,
    sesiones: Sesiones[]
  ): Promise<GraphQLResponse<void>> {
    console.log('📤 Enviando evento al back:', evento);
    const id_usuario = this.authService.getUserUuid();

    // 🔹 Construcción del payload de la actividad
    type ActividadPayloadBackend = Omit<
      Actividades,
      'syncStatus' | 'deleted' | 'plazo_asistencia'
    >;
    type SesionesPayloadBackend = Omit<Sesiones, 'syncStatus' | 'deleted'>;

    let actividadPayload: Actividades = {
      id_actividad: uuidv4(),
      id_programa: evento.id_programa,
      institucional: evento.institucional ? 'S' : 'N',
      id_tipo_actividad: evento.id_tipo_actividad,
      id_responsable: evento.id_responsable,
      id_aliado: evento.id_aliado,
      id_sede: evento.id_sede,
      id_frecuencia: evento.id_frecuencia,
      nombre_actividad: evento.nombre_actividad,
      descripcion: evento.descripcion,
      fecha_actividad: evento.fecha_actividad,
      hora_inicio: evento.hora_inicio,
      hora_fin: evento.hora_fin,
      estado: 'A',
      id_creado_por: id_usuario,
      fecha_creacion: new Date().toISOString().split('T')[0],
      id_modificado_por: null,
      fecha_modificacion: null,
      plazo_asistencia: null, // 👈 solo para IndexedDB
      syncStatus: 'synced', // 👈 solo para IndexedDB
      deleted: false, // 👈 solo para IndexedDB
    };
    const payloadBackend: ActividadPayloadBackend = {
      ...actividadPayload,
    };
    delete (payloadBackend as any).syncStatus;
    delete (payloadBackend as any).deleted;
    delete (payloadBackend as any).plazo_asistencia;

    console.log('📤 Enviando actividad al back:', payloadBackend);

    // Ajustar las sesiones
    sesiones.forEach((s: Sesiones) => {
      s.id_actividad = actividadPayload.id_actividad;
      s.syncStatus = 'synced';
      s.id_creado_por = id_usuario;
      s.fecha_creacion = new Date().toISOString().split('T')[0];
      s.deleted = false;
    });
    return await firstValueFrom(
      this.loadIndexDBService.ping().pipe(
        switchMap((ping) => {
          if (ping === 'pong') {
            console.log('✅ Crear evento Backend activo');
            return this.graphql
              .mutation<{ createActividad: GraphQLResponse<void> }>(
                this.CREATE_ACTIVIDAD,
                { data: payloadBackend }
              )
              .pipe(
                switchMap((res) => {
                  const actividadResponse = res.createActividad;
                  console.log(
                    'Despues de llamado a backend de actividad: ',
                    actividadResponse
                  );
                  // guardar actividad en indexdb

                  if (actividadResponse?.exitoso === 'S') {
                    // 👇 envolvemos la llamada async en from()

                    const sesionesPayloadBackend: SesionesPayloadBackend[] =
                      sesiones.map(({ syncStatus, deleted, ...rest }) => rest);
                    const sesionesPayload = {
                      nuevos: sesionesPayloadBackend,
                      modificados: [],
                      eliminados: [],
                    };

                    return from(
                      this.gridSesionesService.guardarCambiosSesiones(
                        sesionesPayload
                      )
                    ).pipe(
                      tap((sesionesResponse) => {
                        if (sesionesResponse?.exitoso === 'S') {
                          this.actividadesDataSource.create(actividadPayload);

                          sesiones.forEach((s: Sesiones) => {
                            this.sesionesDataSource.create(s);
                          });
                        }
                      }),
                      map(() => actividadResponse)
                    );
                  }

                  return of(actividadResponse);
                }),
                catchError((err) => {
                  console.error(
                    '❌ Error al crear en GraphQL, usando solo IndexDB:',
                    err
                  );

                  // Guardar en IndexDB como pendiente
                  actividadPayload.syncStatus = 'pending-create';
                  this.actividadesDataSource.create(actividadPayload);

                  sesiones.forEach((s: Sesiones) => {
                    this.sesionesDataSource.create({
                      ...s,
                      syncStatus: 'pending-create',
                    });
                  });

                  return of({
                    exitoso: 'S',
                    mensaje: 'Registro guardado satisfactoriamente',
                  });
                })
              );
          } else {
            console.log('Crear evento backend inactivo');
            // Guardar en IndexDB como pendiente
            actividadPayload.syncStatus = 'pending-create';
            this.actividadesDataSource.create(actividadPayload);

            sesiones.forEach((s: Sesiones) => {
              this.sesionesDataSource.create({
                ...s,
                syncStatus: 'pending-create',
              });
            });

            return of({
              exitoso: 'S',
              mensaje: 'Registro guardado satisfactoriamente',
            });
          }
        }) // 👈 cierre del switchMap
      )
    );
  }
}
