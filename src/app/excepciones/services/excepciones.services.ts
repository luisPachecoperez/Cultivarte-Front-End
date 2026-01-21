import { Injectable, inject } from '@angular/core';
import { GraphQLService } from '../../shared/services/graphql.service';
import { firstValueFrom } from 'rxjs';

export interface Excepcion {
  id_excepcion: string;
  error: string;
  mensaje: string;
  id_creado_por: string;
  fecha_creacion: string;
  id_modificado_por: string;
  fecha_modificacion: string;
}

@Injectable({ providedIn: 'root' })
export class ExcepcionesService {
  private readonly graphqlService = inject(GraphQLService);

  private readonly GET_EXCEPCIONES = `
    query GetExcepciones {
      getExcepciones {
        id_excepcion
        error
        mensaje
        id_creado_por
        fecha_creacion
        id_modificado_por
        fecha_modificacion
      }
    }
  `;

  private readonly GUARDAR_CAMBIOS_EXCEPCIONES = `
    mutation GuardarCambiosExcepciones($input: EditarExcepcionesInput!) {
      guardarCambiosExcepciones(input: $input) {
        exitoso
        mensaje
      }
    }
  `;

  async getExcepciones(): Promise<Excepcion[]> {
    const response = await firstValueFrom(
      this.graphqlService.query<{ getExcepciones: Excepcion[] }>(
        this.GET_EXCEPCIONES,
      ),
    );
    return response.getExcepciones;
  }

  async guardarCambiosExcepciones(payload: {
    nuevos: Partial<Excepcion>[];
    modificados: Partial<Excepcion>[];
    eliminados: { id_excepcion: string }[];
  }): Promise<{ exitoso: string; mensaje: string }> {
    const response = await firstValueFrom(
      this.graphqlService.mutation<{
        guardarCambiosExcepciones: { exitoso: string; mensaje: string };
      }>(this.GUARDAR_CAMBIOS_EXCEPCIONES, { input: payload }),
    );
    return response.guardarCambiosExcepciones;
  }
}
