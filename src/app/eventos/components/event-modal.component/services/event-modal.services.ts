import { Injectable } from '@angular/core';
import { firstValueFrom, switchMap, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActividadesDataSource } from '../../../../indexdb/datasources/actividades-datasource';
import { LoadIndexDB } from '../../../../indexdb/services/load-index-db.service';
import { GraphQLResponse } from '../../../../shared/interfaces/graphql-response.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class EventModalService {
  private apiUrl = 'http://localhost:4000/graphql'; // TODO: cambiar por la URL real
  private readonly DELETE_ACTIVIDAD = `
  mutation DeleteActividad($id_actividad: ID!) {
    deleteActividad(id_actividad: $id_actividad) {
      exitoso
      mensaje
    }
  }
`;

  constructor(
    private actividadesDataSource: ActividadesDataSource,
    private loadIndexDB: LoadIndexDB,
    private http: HttpClient
  ) {}

  /**
   * 🗑️ Elimina un evento (solo si asistentes_evento == 0)
   */
  async eliminarEvento(id_actividad: string): Promise<GraphQLResponse> {
    console.log(
      '📤 Enviando mutación de eliminar evento al backend:',
      id_actividad
    );

    return await firstValueFrom(
      this.loadIndexDB.ping().pipe(
        switchMap((ping) => {
          if (ping === 'pong') {
            return this.http
              .post<any>(this.apiUrl, {
                query: this.DELETE_ACTIVIDAD,
                variables: { id_actividad },
              })
              .pipe(map((res) => res.data.deleteActividad as GraphQLResponse));
          } else {
            return from(
              this.actividadesDataSource.delete(id_actividad, true)
            ).pipe(
              map(
                () =>
                  ({
                    exitoso: 'S',
                    mensaje: 'Actividad eliminada exitosamente',
                  } as GraphQLResponse)
              )
            );
          }
        })
      )
    );
  }
}
