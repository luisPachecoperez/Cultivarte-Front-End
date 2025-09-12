import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

import { Observable, from } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { GraphQLService } from '../../shared/services/graphql.service';
import { DatabaseService } from '../../indexdb/services/database.service';
import { SesionesDataSource } from '../../indexdb/datasources/sesiones-datasource';
import { EventInput } from '@fullcalendar/core';
import { inject } from '@angular/core';

export interface EventoCalendario extends EventInput {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    id_actividad: string;
    id_sesion: string;
    asistentes_evento?: number;
    tipo_evento?: string;
    desde?: string;
    hasta?: string;
    [key: string]: unknown;
  };
}

interface SesionResponse {
  id_actividad: string;
  id_sesion: string;
  nombre_actividad: string;
  desde: string;
  hasta: string;
  asistentes_evento?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {

  private graphql = inject(GraphQLService);
  private db = inject(DatabaseService);
  private sesionesDataSource = inject(SesionesDataSource);

  private readonly GET_SESIONES = `
  query ($input: CalendarioInput!) {
    consultarFechaCalendario(input: $input) {
      id_actividad
      id_sesion
      nombre_actividad
      desde
      hasta
      asistentes_evento
    }
  }
`;

  /**
   * 📡 Obtiene sesiones para mostrar en el calendario
   * @param fechaInicio YYYY-MM-DD
   * @param fechaFin YYYY-MM-DD
   * @param idUsuario string
   */
  obtenerSesiones(fechaInicio: string, fechaFin: string, idUsuario: string): Observable<EventoCalendario[]> {
    console.log('📤 Enviando al backend:', { fechaInicio, fechaFin, idUsuario });

    return this.graphql
      .query<{ consultarFechaCalendario: SesionResponse[] }>(this.GET_SESIONES, {
        input: {
          fecha_inicial: fechaInicio,
          fecha_final: fechaFin,
          id_usuario: idUsuario,
        },
      })
      .pipe(
        tap((response) => {
          console.log('Obtuvo sesiones del servicio del graphql', response);
          if (response) {
            console.log('Obtuvo sesiones del servicio');
          }
        }),
        map((response) =>
          (response?.consultarFechaCalendario || []).map((s): EventoCalendario => ({
            id: s.id_sesion ?? crypto.randomUUID(),
            title: s.nombre_actividad ?? '',
            start: (s.desde ?? '').replace(' ', 'T'),
            end: (s.hasta ?? '').replace(' ', 'T'),
            extendedProps: {
              ...s,
              id_actividad: s.id_actividad ?? '',
              id_sesion: s.id_sesion ?? '',
              asistentes_evento: s.asistentes_evento ?? 0,
              desde: s.desde ?? '',
              hasta: s.hasta ?? ''
            }
          }))
        ),
        catchError((error) => {
          console.log('Error en GraphQL:', error);
          console.log('Cargando sesiones desde IndexedDB...');
          return from(
            this.sesionesDataSource.getByRange(
              new Date(fechaInicio),
              new Date(fechaFin),
              idUsuario
            )
          ).pipe(
            map((sesiones) =>
              sesiones.map((s): EventoCalendario => ({
                id: s.id_sesion,
                title: s.nombre_actividad ?? '',
                start: s.desde ?? '',
                end: s.hasta ?? '',
                extendedProps: { ...s, desde: s.desde ?? '', hasta: s.hasta ?? '' },
              }))
            )
          );
        })
      );
  }
}



