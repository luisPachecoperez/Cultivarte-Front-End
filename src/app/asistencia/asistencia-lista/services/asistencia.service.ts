import { Injectable, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Asistencias } from '../../../indexdb/interfaces/asistencias';

import { GraphQLService } from '../../../shared/services/graphql.service';
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

  constructor(private http: HttpClient) {}

  // 🔹 Consultar info de asistencia según id_actividad
  obtenerDetalleAsistencia(id_sesion: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, {
      query: this.GET_PRE_ASISTENCIA,
      variables: { id_sesion }
    }).pipe(
      map(res => res.data.getPreAsistencia)
    );
  }

  // 🔹 Guardar asistencia (unificado)
  guardarAsistencia(input: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, {
      query: this.UPDATE_ASISTENCIAS,
      variables: { input }
    }).pipe(
      map(res => res.data.updateAsistencias)
    );
  }

  // 🔹 Guardar asistencia fotográfica
  guardarAsistenciaFotografica(input: any):  Observable<{ exitoso: string; mensaje: string }>  {

    console.log('📤 Enviando asistencia EN EL SERVICES:', input);


    return this.http.post<any>(this.apiUrl, {
      query: this.UPDATE_ASISTENCIAS,
      variables: { input }
    }).pipe(
      map(res => res.data.updateAsistencias)
    );
  }


}
