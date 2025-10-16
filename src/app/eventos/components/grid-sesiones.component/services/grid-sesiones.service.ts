import { Injectable, inject } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { GraphQLService } from '../../../../shared/services/graphql.service';
import { GraphQLResponse } from '../../../../shared/interfaces/graphql-response.interface';
import { AuthService } from '../../../../shared/services/auth.service';
import { LoadIndexDBService } from '../../../../indexdb/services/load-index-db.service';
import { Sesiones } from '../../../interfaces/sesiones.interface';
import { SesionesDB } from '../../../../indexdb/interfaces/sesiones.interface';
import { SesionesDataSource } from '../../../../indexdb/datasources/sesiones-datasource';
@Injectable({
  providedIn: 'root',
})
export class GridSesionesService {
  private readonly graphQLService = inject(GraphQLService);
  private readonly authService = inject(AuthService);
  private readonly loadIndexDBService = inject(LoadIndexDBService);
  private readonly sesionesDataSource = inject(SesionesDataSource);

  constructor() {}

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
    eliminados: { id_sesion: string }[];
    modificados: Sesiones[];
    nuevos: Sesiones[];
  }): Promise<GraphQLResponse> {
    const { nuevos, modificados, eliminados } = payload;
    const modificadosPorUsuario: Sesiones[] = modificados.map(
      (s: Sesiones) => ({
        ...s,
        id_modificado_por: this.authService.getUserUuid(),
        id_creado_por: s.id_creado_por,
      }),
    );

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
        modificados: modificadosPorUsuario,
        eliminados: eliminados,
      },
    };
    return await firstValueFrom(
      this.loadIndexDBService.ping().pipe(
        switchMap((ping) => {
          if (ping === 'pong') {
            return this.graphQLService
              .mutation<{
                updateSesiones: GraphQLResponse;
              }>(updateSesiones, variables)
              .pipe(
                map((res) => {
                  const nuevosIndexDB: Sesiones[] = nuevos.map(
                    (s: Sesiones) => ({
                      ...s,
                      syncStatus: 'synced',
                      deleted: false,
                    }),
                  );

                  nuevosIndexDB.forEach((s: Sesiones) => {
                    const sesion: SesionesDB = {
                      ...s,
                      id_sesion: s.id_sesion ?? '',
                      syncStatus: 'synced',
                      deleted: false,
                    };
                    this.sesionesDataSource.create(sesion);
                  });

                  const modificadosIndexDB: SesionesDB[] =
                    modificadosPorUsuario.map((s: Sesiones) => ({
                      ...s,
                      id_sesion: s.id_sesion ?? '',
                      syncStatus: 'synced',
                      deleted: false,
                    }));
                  // Modificados -> synced
                  modificadosIndexDB.forEach((s: SesionesDB) => {
                    this.sesionesDataSource.update(s.id_sesion, s);
                  });

                  // Eliminados -> delete
                  eliminados.forEach((s: { id_sesion: string }) => {
                    this.sesionesDataSource.delete(s.id_sesion, false);
                  });

                  return res.updateSesiones; // 👈 devolvemos respuesta real del backend
                }),
                catchError((error) => {
                  console.error('❌ Error en updateSesiones:', error);
                  return of({
                    exitoso: 'N',
                    mensaje: 'Error actualizando sesiones:' + error,
                  });
                }),
              );
          } else {
            // Nuevos -> pending
            nuevos.forEach((s: Sesiones) => {
              const sesion: SesionesDB = {
                ...s,
                id_sesion: s.id_sesion ?? '',
                syncStatus: 'pending-create',
                deleted: false,
              };
              this.sesionesDataSource.create(sesion);
            });

            // Modificados -> pending
            modificadosPorUsuario.forEach((s: Sesiones) => {
              const sesion: SesionesDB = {
                ...s,
                id_sesion: s.id_sesion ?? '',
                syncStatus: 'pending-update',
                deleted: false,
              };
              this.sesionesDataSource.update(sesion.id_sesion, sesion);
            });

            // Eliminados -> marcado como deleted
            eliminados.forEach((s) => {
              this.sesionesDataSource.delete(s.id_sesion, true);
            });

            return of({
              exitoso: 'S',
              mensaje: 'Sesiones actualizadas correctamente',
            });
          }
        }),
      ),
    );
  }
}
