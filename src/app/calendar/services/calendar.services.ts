import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

import { GraphQLService } from '../../shared/services/graphql.service';
import { DatabaseService } from '../../indexdb/services/database.service';
import { SesionesDataSource } from '../../indexdb/datasources/sesiones-datasource';

import { SesionBackendDTO } from '../interfaces/calendar-backend.interface';
import { EventoCalendario } from '../interfaces/calendar.interface';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
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

  constructor(
    private graphql: GraphQLService,
    private db: DatabaseService,
    private sesionesDataSource: SesionesDataSource
  ) {}

  /**
   * 📡 Obtiene sesiones para mostrar en el calendario
   * @param fechaInicio YYYY-MM-DD
   * @param fechaFin YYYY-MM-DD
   * @param idUsuario string
   */
  obtenerSesiones(fechaInicio: string, fechaFin: string, idUsuario: string) {
    console.log('📤 Enviando al backend:', { fechaInicio, fechaFin, idUsuario });

    return this.graphql
      .query<{ consultarFechaCalendario: SesionBackendDTO[] }>(this.GET_SESIONES, {
        input: {
          fecha_inicial: fechaInicio,
          fecha_final: fechaFin,
          id_usuario: idUsuario,
        },
      })
      .pipe(
        tap(async (response) => {
          console.log('Obtuvo sesiones del servicio GraphQL:', response);
          if (response) {
            // Opcional: guardar en IndexedDB si quieres persistencia offline
            // await this.sesionesDataSource.bulkAdd(response.consultarFechaCalendario);
          }
        }),
        map((response) =>
          (response?.consultarFechaCalendario || []).map((s): EventoCalendario => ({
            id: s.id_sesion,
            title: s.nombre_actividad ?? '',
            start: s.desde ? s.desde.replace(' ', 'T') : '', // ✅ FullCalendar ISO
            end: s.hasta ? s.hasta.replace(' ', 'T') : '',
            extendedProps: {
              id: s.id_sesion,
              nombreSesion: s.nombre_actividad ?? '',
              fecha: s.desde?.split(' ')[0] ?? '',
              horaInicio: s.desde?.split(' ')[1]?.substring(0, 5) ?? '',
              horaFin: s.hasta?.split(' ')[1]?.substring(0, 5) ?? '',
              id_actividad: s.id_actividad,
              id_sesion: s.id_sesion,
              asistentes_evento: s.asistentes_evento,
            }
          }))
        ),
        catchError((error) => {
          console.error('❌ Error en GraphQL:', error);
          console.log('Cargando sesiones desde IndexedDB...');

          return from(
            this.sesionesDataSource.getByRange(
              new Date(fechaInicio),
              new Date(fechaFin),
              idUsuario
            )
          ).pipe(
            map((sesiones: SesionBackendDTO[]) =>
              sesiones.map((s): EventoCalendario => ({
                id: s.id_sesion,
                title: s.nombre_actividad ?? '',
                start: s.desde ? s.desde.replace(' ', 'T') : '',
                end: s.hasta ? s.hasta.replace(' ', 'T') : '',
                extendedProps: {
                  id: s.id_sesion,
                  nombreSesion: s.nombre_actividad ?? '',
                  fecha: s.desde?.split(' ')[0] ?? '',
                  horaInicio: s.desde?.split(' ')[1]?.substring(0, 5) ?? '',
                  horaFin: s.hasta?.split(' ')[1]?.substring(0, 5) ?? '',
                  id_actividad: s.id_actividad,
                  id_sesion: s.id_sesion,
                  asistentes_evento: s.asistentes_evento,
                }
              }))
            )
          );
        })
      );
  }
}
