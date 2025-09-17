import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';


import { firstValueFrom } from 'rxjs';


import { v4 as uuidv4 } from 'uuid';
import { Sesiones } from '../../../../indexdb/interfaces/sesiones';
import { GraphQLService } from '../../../../shared/services/graphql.service';
import { GraphQLResponse } from '../../../../shared/interfaces/graphql-response.model';
import { AuthService } from '../../../../shared/services/auth.service';
@Injectable({
  providedIn: 'root'
})
export class GridSesionesService {

  constructor(private graphQLService: GraphQLService, private authService: AuthService) {}

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
  }): Promise<GraphQLResponse|any> {
    console.log('📤 Payload de sesiones al back:', payload);

    const { nuevos, modificados, eliminados } = payload;


    const createWithUUID = nuevos.map((s) => ({
      ...s,
      id_sesion: uuidv4(),
      id_creado_por: this.authService.getUserUuid(),
      id_modificado_por: this.authService.getUserUuid(),
    }));

    const updateWithUUID = modificados.map((s) => ({
      ...s,
      id_modificado_por: this.authService.getUserUuid(),
      id_creado_por:s.id_creado_por
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
        nuevos: createWithUUID,
        modificados: updateWithUUID,
        eliminados: eliminados,
      },
    };

    try {
      const response = await firstValueFrom(
        this.graphQLService.mutation<{ updateSesiones: GraphQLResponse<any> }>(
          updateSesiones,
          variables
        )
      );
      return response.updateSesiones;
    } catch (error: any) {
      console.error('❌ Error en updateSesiones:', error);
      return {
        exitoso: "N",
        mensaje: error?.mensaje || 'Error al enviar sesiones',
      };
    }
  }
}
