import { Injectable } from '@angular/core';
import { firstValueFrom, switchMap, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActividadesDataSource } from '../../../../indexdb/datasources/actividades-datasource';
import { LoadIndexDBService } from '../../../../indexdb/services/load-index-db.service';
import { GraphQLResponse } from '../../../../shared/interfaces/graphql-response.interface';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { GraphQLService } from '../../../../shared/services/graphql.service';
@Injectable({
  providedIn: 'root',
})
export class EventModalService {
  private readonly DELETE_ACTIVIDAD = `
  mutation DeleteActividad($id_actividad: ID!) {
    deleteActividad(id_actividad: $id_actividad) {
      exitoso
      mensaje
    }
  }
`;

private actividadesDataSource=inject( ActividadesDataSource);
private loadIndexDBService =inject(LoadIndexDBService);
private graphQLService= inject(GraphQLService);

  constructor(
  ) {}

  /**
   * 🗑️ Elimina un evento (solo si asistentes_evento == 0)
   */
  async eliminarEvento(id_actividad: string): Promise<GraphQLResponse> {
    //console.log('📤 Enviando mutación de eliminar evento al backend:',id_actividad );

    return await firstValueFrom(
      this.loadIndexDBService.ping().pipe(
        switchMap((ping) => {
          if (ping === 'pong') {
            // 🔹 Llamada al backend
            return this.graphQLService
              .mutation<{ deleteActividad: GraphQLResponse }>(
                this.DELETE_ACTIVIDAD,
                { id_actividad }
              )
              .pipe(
                switchMap(async (res) => {
                  const result = res.deleteActividad;
                  if (result.exitoso === 'S') {
                    // 🔹 Borrado definitivo en indexDB
                    await this.actividadesDataSource.delete(id_actividad, false);
                  }
                  return result;
                })
              );
          } else {
            // 🔹 Modo offline → solo marcado como eliminado
            return from(this.actividadesDataSource.delete(id_actividad, true)).pipe(
              map(
                () =>
                  ({
                    exitoso: 'S',
                    mensaje: 'Actividad marcada para eliminación (offline)',
                  } as GraphQLResponse)
              )
            );
          }
        })
      )
    );

  }
}
