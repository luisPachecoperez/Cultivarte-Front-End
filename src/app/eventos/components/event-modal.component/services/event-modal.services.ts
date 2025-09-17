import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';
import { GraphQLService } from '../../../../shared/services/graphql.service';
import { AuthService } from '../../../../shared/services/auth.service';
@Injectable({
  providedIn: 'root'
})
export class EventModalService {

  private apiUrl = 'http://localhost:4000/graphql';// TODO: cambiar por la URL real
  private readonly DELETE_ACTIVIDAD = `
  mutation DeleteActividad($id_actividad: ID!) {
    deleteActividad(id_actividad: $id_actividad) {
      exitoso
      mensaje
    }
  }
`;


  constructor(private graphQLService: GraphQLService, private authService: AuthService) {}

  /**
   * 🗑️ Elimina un evento (solo si asistentes_evento == 0)
   */
  eliminarEvento(id_actividad: string) {
    console.log('📤 Enviando mutación de eliminar evento al backend:', id_actividad);

    return this.graphQLService.mutation<{ deleteActividad: { exitoso: string; mensaje: string } }>(
      this.DELETE_ACTIVIDAD,
      { id_actividad }
    ).pipe(
      map(resp => resp.deleteActividad), // 👈 devolvemos directamente el objeto { exitoso, mensaje }
      tap(resp => console.log('📥 Respuesta backend:', resp)),
      catchError(err => {
        console.error('❌ Error al eliminar evento:', err);
        return throwError(() => ({
          exitoso: 'N',
          mensaje: 'Error en el servidor al eliminar evento'
        }));
      })
    );
  }
}
