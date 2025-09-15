import { Injectable, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  firstValueFrom,
  map,
  mergeMap,
  from,
  switchMap,
  of,
  catchError,tap
} from 'rxjs';
import { LoadIndexDB } from '../../../indexdb/services/load-index-db.service';
import { ActividadesDataSource } from '../../../indexdb/datasources/actividades-datasource';
import { PreAsistencia } from '../../../shared/interfaces/preasistencia.model';
import { Asistencias } from '../../../indexdb/interfaces/asistencias';
import { AsistenciasDataSource } from '../../../indexdb/datasources/asistencias-datasource';
import { SesionesDataSource } from '../../../indexdb/datasources/sesiones-datasource';
import { GraphQLResponse } from '../../../shared/interfaces/graphql-response.model';
@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private apiUrl = 'http://localhost:4000/graphql'; // 👈 Ajusta a tu backend real
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

  // ✅ Activa o desactiva el modo mock
  private usarMock = true;

  constructor(
    private http: HttpClient,
    private actividadesDataSource: ActividadesDataSource,
    private loadIndexDB: LoadIndexDB,
    private asistenciasDataSource: AsistenciasDataSource,
    private sesionesDataSource: SesionesDataSource
  ) {}

  // 🔹 Consultar info de asistencia según id_actividad
  async obtenerDetalleAsistencia(id_sesion: string): Promise<PreAsistencia> {
    return await firstValueFrom(
      this.loadIndexDB.ping().pipe(
        switchMap((ping) => {
          console.log('ping en update sesiones:', ping);
          if (ping === 'pong') {
            console.log('Update sesiones backend activo');
            return this.http
              .post<any>(this.apiUrl, {
                query: this.GET_PRE_ASISTENCIA,
                variables: { id_sesion },
              })
              .pipe(map((res) => res.data.getPreAsistencia));
          } else {
            return from(this.actividadesDataSource.getPreAsistencia(id_sesion)).pipe(
              tap((preAsistencia) =>
                console.log('👉 preAsistencia calculada:', preAsistencia)
              )
            );
          }
        })
      )
    );
  }

  async guardarAsistencia(input: any): Promise<GraphQLResponse> {
    return await firstValueFrom(
      this.loadIndexDB.ping().pipe(
        switchMap((ping) => {
          console.log('ping en update asistencias:', ping);

          if (ping === 'pong') {
            console.log('✅ Backend activo: enviando asistencias');
            return this.http
              .post<any>(this.apiUrl, {
                query: this.UPDATE_ASISTENCIAS,
                variables: { input },
              })
              .pipe(
                map((res) => {
                  console.log('✅ updateAsistencias OK:', res);

                  // Nuevas -> synced
                  input.nuevos.forEach((a: Asistencias) => {
                    this.asistenciasDataSource.create({
                      ...a,
                      syncStatus: 'synced',
                    });
                  });

                  return res.data.updateAsistencias;
                }),
                catchError((error) => {
                  console.error('❌ Error en updateAsistencias:', error);

                  // Nuevas -> pending
                  input.nuevos.forEach((a: Asistencias) => {
                    this.asistenciasDataSource.create({
                      ...a,
                      syncStatus: 'pending-create',
                    });
                  });

                  return of({
                    exitoso: 'S',
                    mensaje: 'Asistencias guardadas satisfactoriamente',
                  });
                })
              );
          } else {
            console.log('⚠️ Backend inactivo: guardando offline');

            // Nuevas -> pending
            input.nuevos.forEach((a: Asistencias) => {
              this.asistenciasDataSource.create({
                ...a,
                syncStatus: 'pending-create',
              });
            });

            return of({
              exitoso: 'S',
              mensaje: 'Asistencias guardadas satisfactoriamente',
            });
          }
        })
      )
    );
  }

  /*
  guardarAsistencia(input: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, {
      query: this.UPDATE_ASISTENCIAS,
      variables: { input }
    }).pipe(
      map(res => res.data.updateAsistencias)
    );
  }
  */async guardarAsistenciaFotografica(input: any): Promise<GraphQLResponse> {
    console.log("Evidencia fotografica:", input)
  return await firstValueFrom(
    this.loadIndexDB.ping().pipe(
      switchMap((ping) => {
        if (ping === 'pong') {
          return this.http
            .post<any>(this.apiUrl, {
              query: this.UPDATE_ASISTENCIAS,
              variables: { input },
            })
            .pipe(
              mergeMap((res) =>
                from(this.sesionesDataSource.getById(input.id_sesion)).pipe(
                  mergeMap((sesion) =>
                    from(
                      this.sesionesDataSource.update(input.id_sesion, {
                        ...sesion,
                        syncStatus: 'synced',
                        deleted: false,
                        imagen: input.imagen,
                        descripcion: input.descripcion,
                        nro_asistentes: input.numero_asistentes,
                      })
                    ).pipe(
                      map(() => {
                        console.log('📥 Sesión actualizada en IndexedDB (synced)');
                        return res.data.updateAsistencias;
                      })
                    )
                  )
                )
              )
            );
        } else {
          return from(this.sesionesDataSource.getById(input.id_sesion)).pipe(
            mergeMap((sesion) =>
              from(
                this.sesionesDataSource.update(input.id_sesion, {
                  ...sesion,
                  syncStatus: 'pending-update',
                  deleted: false,
                  imagen: input.imagen,
                  descripcion: input.descripcion,
                  nro_asistentes: input.numero_asistentes,
                })
              ).pipe(
                map(() => {
                  console.log('Asistencia actualizada correctamente');
                  return {
                    exitoso: 'S',
                    mensaje: 'Asistencia actualizada correctamente',
                  };
                })
              )
            )
          );
        }
      })
    )
  );
}
}
