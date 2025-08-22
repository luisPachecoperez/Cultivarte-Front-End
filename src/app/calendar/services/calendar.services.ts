import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {

  constructor() {}

  /**
   * 📡 Obtiene sesiones para mostrar en el calendario
   * @param fechaInicio YYYY-MM-DD
   * @param fechaFin YYYY-MM-DD
   * @param idUsuario string
   */
  obtenerSesiones(fechaInicio: string, fechaFin: string, idUsuario: string) {
    console.log('📤 Enviando al backend:', { fechaInicio, fechaFin, idUsuario });

    // 🔹 Simulación de respuesta GraphQL
    const mockResponse = {
      data: [
        {
          id_evento: "123a-345b",
          id_sesion: "123a-3444",
          nombre_actividad: "Reunión de equipo",
          desde: "2025-08-12 15:00:00",
          hasta: "2025-08-12 16:00:00",
          asistentes_evento: 5
        },
        {
          id_evento: "443a-345b",
          id_sesion: "563a-3444",
          nombre_actividad: "Presentación de proyecto",
          desde: "2025-08-19 11:00:00",
          hasta: "2025-08-19 12:00:00",
          asistentes_evento: 0
        }
      ]
    };

    // ⏳ Simulamos una espera como si fuera una petición HTTP
    return of(mockResponse).pipe(
      delay(500),
      map(res => res.data.map(e => ({
        id: e.id_sesion,
        title: e.nombre_actividad,
        start: e.desde.replace(' ', 'T'),
        end: e.hasta.replace(' ', 'T'),
        extendedProps: {
          idEvento: e.id_evento,
          asistentes: e.asistentes_evento
        }
      })))
    );
  }
}
