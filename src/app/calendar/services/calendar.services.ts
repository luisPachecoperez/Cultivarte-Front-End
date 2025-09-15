import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

import { firstValueFrom, from } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Sesiones } from '../../indexdb/interfaces/sesiones';
import { GraphQLService } from '../../shared/services/graphql.service';
import { ActividadesDataSource } from '../../indexdb/datasources/actividades-datasource';
import { LoadIndexDB } from '../../indexdb/services/load-index-db.service';
import { switchMap } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
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
    private actividadesDataSource: ActividadesDataSource,
    private loadIndexDB: LoadIndexDB
  ) {}

  /**
   * 📡 Obtiene sesiones para mostrar en el calendario
   * @param fechaInicio YYYY-MM-DD
   * @param fechaFin YYYY-MM-DD
   * @param id_usuario string
   */

  async obtenerSesiones(fechaInicio: string, fechaFin: string, id_usuario: string) {
    return await firstValueFrom(
     this.loadIndexDB.ping().pipe(
      switchMap((ping) => {
        if (ping === 'pong') {
          console.log('✅ Backend activo');
          return this.graphql
            .query<{ consultarFechaCalendario: Sesiones[] }>(this.GET_SESIONES, {
              input: {
                fecha_inicial: fechaInicio,
                fecha_final: fechaFin,
                id_usuario: id_usuario,
              },
            })
            .pipe(
              tap((response) => {
                console.log('Obtuvo sesiones del servicio del graphql', response);
              }),
              map((response) =>
                (response?.consultarFechaCalendario || []).map((s) => ({
                  id: s.id_sesion,
                  title: s.nombre_actividad,
                  start: s.desde,
                  end: s.hasta,
                  extendedProps: { ...s },
                }))
              ),
              catchError((err) => {
                console.error('❌ Error con GraphQL, usando fallback local:', err);
                return from(
                  this.actividadesDataSource.consultarFechaCalendario(
                    new Date(fechaInicio),
                    new Date(fechaFin),
                    id_usuario
                  )
                );
              })
            );
        } else {
          console.log('❌ Backend inactivo → usando IndexedDB');
          return from(
            this.actividadesDataSource.consultarFechaCalendario(
              new Date(fechaInicio),
              new Date(fechaFin),
              id_usuario
            )
          );
        }
      })
    )
  );
  }
}
