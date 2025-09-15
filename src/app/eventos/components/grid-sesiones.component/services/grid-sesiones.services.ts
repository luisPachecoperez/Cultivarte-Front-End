import { Injectable } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GraphQLService } from '../../../../shared/services/graphql.service';
import { GraphQLResponse } from '../../../../shared/interfaces/graphql-response.model';
import { AuthService } from '../../../../shared/services/auth.service';
import { switchMap } from 'rxjs/operators';
import { LoadIndexDB } from '../../../../indexdb/services/load-index-db.service';
import { Sesiones } from '../../../../indexdb/interfaces/sesiones';
import { SesionesDataSource } from '../../../../indexdb/datasources/sesiones-datasource';
@Injectable({
  providedIn: 'root',
})
export class GridSesionesService {
  constructor(
    private graphQLService: GraphQLService,
    private authService: AuthService,
    private loadIndexDB: LoadIndexDB,
    private sesionesDataSource: SesionesDataSource
  ) {}

  /**
   * 📤 Envía cambios de sesiones al backend
   * @param payload Objeto con estructura:
   * {
   *   sesiones: {
   *     nuevos: [...],
   *     modificados: [...],
   *     eliminados: [...]
   *   }
   * }
   */
  async guardarCambiosSesiones(payload: {
    eliminados: any[];
    modificados: any[];
    nuevos: any[];
  }): Promise<GraphQLResponse | any> {
    const { nuevos, modificados, eliminados } = payload;
    const updateWithUUID = modificados.map((s) => ({
      ...s,
      id_modificado_por: this.authService.getUserUuid(),
      id_creado_por: s.id_creado_por,
    }));

    const updateSesiones = `
    mutation ($input: EditarSesiones!) {
      updateSesiones(input: $input) {
        exitoso
        mensaje
      }
    }
  `;

    const variables = {
      input: {
        nuevos: nuevos,
        modificados: updateWithUUID,
        eliminados: eliminados,
      },
    };
    console.log('📤 llamado a update de sesiones al back:', payload);
    return await firstValueFrom(
      this.loadIndexDB.ping().pipe(
        switchMap((ping) => {
          console.log('ping en update sesiones:', ping);

          if (ping === 'pong') {
            console.log('Update sesiones backend activo');

            return this.graphQLService
              .mutation<{ updateSesiones: GraphQLResponse<any> }>(
                updateSesiones,
                variables
              )
              .pipe(
                map((res) => {
                  console.log('✅ updateSesiones OK:', res);

                  // Nuevos -> synced
                  nuevos.forEach((s: Sesiones) => {
                    this.sesionesDataSource.create({
                      ...s,
                      syncStatus: 'synced',
                    });
                  });

                  // Modificados -> synced
                  updateWithUUID.forEach((s: Sesiones) => {
                    this.sesionesDataSource.update(s.id_sesion, {
                      ...s,
                      syncStatus: 'synced',
                    });
                  });

                  // Eliminados -> delete
                  eliminados.forEach((s: Sesiones) => {
                    this.sesionesDataSource.delete(s.id_sesion, false);
                  });

                  return res.updateSesiones; // 👈 devolvemos respuesta real del backend
                }),
                catchError((error) => {
                  console.error('❌ Error en updateSesiones:', error);
                  //Si hay error escribir en indexdb, pero con synced=pending
                  // Nuevos -> pending
                  nuevos.forEach((s: Sesiones) => {
                    this.sesionesDataSource.create({
                      ...s,
                      syncStatus: 'pending-create',
                    });
                  });

                  // Modificados -> pending
                  updateWithUUID.forEach((s: Sesiones) => {
                    this.sesionesDataSource.update(s.id_sesion, {
                      ...s,
                      syncStatus: 'pending-update',
                    });
                  });

                  // Eliminados -> marcado como deleted
                  eliminados.forEach((s: Sesiones) => {
                    this.sesionesDataSource.delete(s.id_sesion, true);
                  });

                  return of({
                    exitoso: 'S',
                    mensaje: 'Sesiones actualizadas correctamente',
                  });
                })
              );
          } else {
            console.log('Update sesiones backend inactivo');

            // Nuevos -> pending
            nuevos.forEach((s: Sesiones) => {
              this.sesionesDataSource.create({
                ...s,
                syncStatus: 'pending-create',
              });
            });

            // Modificados -> pending
            updateWithUUID.forEach((s: Sesiones) => {
              this.sesionesDataSource.update(s.id_sesion, {
                ...s,
                syncStatus: 'pending-update',
              });
            });

            // Eliminados -> marcado como deleted
            eliminados.forEach((s: Sesiones) => {
              this.sesionesDataSource.delete(s.id_sesion, true);
            });

            return of({
              exitoso: 'S',
              mensaje: 'Sesiones actualizadas correctamente',
            });
          }
        })
      )
    );
  }
}
