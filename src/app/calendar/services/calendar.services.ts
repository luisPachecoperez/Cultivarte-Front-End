import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { Observable, from } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Sesiones } from '../../indexdb/interfaces/sesiones';
import { GraphQLService } from '../../shared/services/graphql.service';
import { DatabaseService } from '../../indexdb/services/database.service';
// import { SesionesDataSource } from '../../indexdb/datasources/sesiones-datasource';
import { SesionesDataSource } from '../../indexdb/datasources/sesiones-datasource';

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
      .query<{ consultarFechaCalendario: Sesiones[] }>(this.GET_SESIONES, {
        input: {
          fecha_inicial: fechaInicio,
          fecha_final: fechaFin,
          id_usuario: idUsuario,
        },
      })
      .pipe(
        tap(async (response) => {
          console.log('Obtuvo sesiones del servicio del graphql', response);
          if (response) {
            console.log('Obtuvo sesiones del servicio');
            //Ojo aqui, son sesiones por rango de fechas, no son todas las sesiones
            //Esto debe estar cuando se abre el calendario
            // await this.sesionesDataSource.bulkAdd(response.consultarFechaCalendario);
          }
        }),
        map((response) =>
          (response?.consultarFechaCalendario || []).map(s => ({
            id: s.id_sesion,
            title: s.nombre_actividad,
            start: s.desde,   // 👈 mapeo correcto
            end: s.hasta,     // 👈 mapeo correcto
            extendedProps: { ...s }
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
            // 👇 también mapear IndexedDB al formato de FullCalendar
            map((sesiones) =>
              sesiones.map(s => ({
                id: s.id_sesion,
                title: s.nombre_actividad,
                start: s.desde,
                end: s.hasta,
                extendedProps: { ...s }
              }))
            )
          );
        })
      );
  }
}



// 🔹 Simulación de respuesta GraphQL
// const mockResponse = {
//   data: [
//     {
//       id_actividad: "50e8400-e29b-41d4-a716-4466521320",
//       id_sesion: "2c45f738-52ad-4b83-a588-346568126948",
//       nombre_actividad: "contenido del ciclo",
//       desde: "2025-08-20 16:00:00",
//       hasta: "2025-08-20 18:00:00",
//       asistentes_evento: 0
//     },
//     {
//       id_actividad: "50e8400-e29b-41d4-a716-4466521320",
//       id_sesion: "03aebcca-4a86-4aea-a413-d398a8277d21",
//       nombre_actividad: "ludoteca viajera",
//       desde: "2025-08-21 16:00:00",
//       hasta: "2025-08-21 18:00:00",
//       asistentes_evento: 2
//     }
//   ]
// };


// // ⏳ Simulamos una espera como si fuera una petición HTTP
// return of(mockResponse).pipe(
//   delay(500),
//   map(res => res.data.map(e => ({
//     id: e.id_sesion,
//     title: e.nombre_actividad,
//     start: e.desde.replace(' ', 'T'),
//     end: e.hasta.replace(' ', 'T'),
//     extendedProps: {
//       idEvento: e.id_actividad,
//       asistentes: e.asistentes_evento
//     }
//   })))
// );
