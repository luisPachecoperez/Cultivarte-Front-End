import { Injectable, inject } from '@angular/core';

import { firstValueFrom, from } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';
import { Sesiones } from '../../eventos/interfaces/sesiones.interface';
import { GraphQLService } from '../../shared/services/graphql.service';
import { ActividadesDataSource } from '../../indexdb/datasources/actividades-datasource';
import { LoadIndexDBService } from '../../indexdb/services/load-index-db.service';
import { EventoCalendario } from '../interfaces/evento-calendario.interface';
@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private readonly CONSULTAR_FECHA_CALENDARIO = `
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
  private readonly graphqlService = inject(GraphQLService);
  private readonly actividadesDataSource = inject(ActividadesDataSource);
  private readonly loadIndexDBService = inject(LoadIndexDBService);
  constructor() {}

  /**
   * 📡 Obtiene sesiones para mostrar en el calendario
   * @param fechaInicio YYYY-MM-DD
   * @param fechaFin YYYY-MM-DD
   * @param id_usuario string
   */

  async obtenerSesiones(
    fechaInicio: string,
    fechaFin: string,
    id_usuario: string,
  ): Promise<EventoCalendario[]> {
    return <EventoCalendario[]>await firstValueFrom(
      this.loadIndexDBService.ping().pipe(
        switchMap((ping) => {
          if (ping === 'pong') {
            return this.graphqlService
              .query<{ consultarFechaCalendario: Sesiones[] }>(
                this.CONSULTAR_FECHA_CALENDARIO,
                {
                  input: {
                    fecha_inicial: fechaInicio,
                    fecha_final: fechaFin,
                    id_usuario: id_usuario,
                  },
                },
              )
              .pipe(
                tap((response) => {
                  console.log(
                    'Obtuvo sesiones del servicio del graphql',
                    response,
                  );
                }),
                map((response) =>
                  (response?.consultarFechaCalendario || []).map((s) => ({
                    id: s.id_sesion,
                    title: s.nombre_actividad,
                    start: s.desde,
                    end: s.hasta,
                    extendedProps: { ...s },
                  })),
                ),
                catchError((err) => {
                  console.error(
                    '❌ Error con GraphQL, usando fallback local:',
                    err,
                  );
                  return from(
                    this.actividadesDataSource.consultarFechaCalendario(
                      new Date(fechaInicio),
                      new Date(fechaFin),
                      id_usuario,
                    ),
                  );
                }),
              );
          } else {
            return from(
              this.actividadesDataSource.consultarFechaCalendario(
                new Date(fechaInicio),
                new Date(fechaFin),
                id_usuario,
              ),
            );
          }
        }),
      ),
    );
  }
}
