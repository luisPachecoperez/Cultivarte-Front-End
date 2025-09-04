import { Injectable } from '@angular/core';
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
      }
    }
  }
`;
private readonly ACTUALIZAR_SESION = `
mutation ActualizarSesion($input: UpdateSesionInput!) {
  updateSesion(input: $input) {
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
    // if (this.usarMock) {
    //   console.log('📥 [MOCK] obteniendo detalle de asistencia para:', id_actividad);

    //   const mockResponse = {
    //     id_actividad: "550e8400-e29b446655440000",
    //     id_sesion: "550e-e29b4466554400",
    //     id_sede: "550e8400-e29b-41d4-a716-446655440000",
    //     numero_asistentes: 0,
    //     foto: "N", // 👈 Cambia a "N" para probar asistencia normal
    //     imagen: "https://storage.googleapis.com/[BUCKET_NAME]/[IMAGE_NAME]",
    //     sedes: [
    //       { id_sede: "550e8400-e29b-41d4-a716-446655440001", nombre_sede: "Sede Central" },
    //       { id_sede: "550e8400-e29b-41d4-a716-446655440002", nombre_sede: "Sede Norte" }
    //     ],
    //     beneficiarios: [
    //       {
    //         id_persona: "123e4567-e89b-12d3-a456-426614174000",
    //         nombre_completo: "Juan Pérez",
    //         id_sede: "550e8400-e29b-41d4-a716-446655440001"
    //       },
    //       {
    //         id_persona: "123e4567-e89b-12d3-a456-426614174001",
    //         nombre_completo: "María López",
    //         id_sede: "550e8400-e29b-41d4-a716-446655440002"
    //       }
    //     ],
    //     asistentes_sesiones: [
    //       { id_persona: "123e4567-e89b-12d3-a456-426614174002" },
    //       { id_persona: "123e4567-e89b-12d3-a456-426614174003" }
    //     ]
    //   };

    //   return of(mockResponse).pipe(delay(800));
    // }

    // return this.http.post<any>(`${this.apiUrl}/detalle`, { id_actividad });
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
  guardarAsistenciaFotografica(asistencia: any):  Observable<{ exitoso: string; mensaje: string }>  {
    const input = {
      id_sesion: asistencia.id_sesion,
      id_actividad: asistencia.id_actividad,
      fecha_actividad: asistencia.fecha_actividad,
      hora_inicio: asistencia.hora_inicio,
      hora_fin: asistencia.hora_fin,
      imagen: asistencia.imagen,
      nro_asistentes: asistencia.nro_asistentes,
    };


    return this.http.post<any>(this.apiUrl, {
      query: this.ACTUALIZAR_SESION,
      variables: { input }
    }).pipe(
      map(res => res.data.updateSesion)
    );
  }


}
