import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private apiUrl = 'http://localhost:3000/crear-evento';// TODO: cambiar por la URL real

  constructor(private http: HttpClient) {}

 /**
   * 📡 Obtiene sesiones para mostrar en el calendario
   * @param fechaInicio YYYY-MM-DD
   * @param fechaFin YYYY-MM-DD
   * @param idUsuario string
   */

 obtenerSesiones(fechaInicio: string, fechaFin: string, idUsuario: string) {
  console.log('📤 Enviando al backend:', { fechaInicio, fechaFin, idUsuario });

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
        nombre_actividad: "Ludoteca Viajera",
        desde: "2025-08-19 11:00:00",
        hasta: "2025-08-19 12:00:00",
        asistentes_evento: 0
      }
    ]
  };

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

/**
 * 📡 Obtiene un evento por su ID con parámetros y sesiones (Mock GraphQL)
 * @param idEvento string
 */
obtenerEventoPorId(idEvento: string) {
  console.log(`📡 Mock GraphQL → Buscando evento con ID: ${idEvento}`);

  return of({
    evento: {
      id_programa: "e29b-41d4-a716-446655440000",
      id_evento: "50e8400-e29b-41d4-a716-4466521320",
      institucional: "S",
      id_tipo_actividad: "550e8400-e29b-41d4-a716-446655440002",
      id_responsable: "50e8400-a716",
      id_aliado: "e29b-41d4-a716",
      id_sede: "50e8400-446655440000",
      nombre_actividad: "xyz",
      descripcion: "xyz",
      id_frecuencia: "50e8400-e29b-440000",
      fecha_sesion: "2025-12-13",
      hora_inicio: "14:00",
      hora_fin: "14:00"
    },
    parametros: {
      sedes: [
        { id: "550e8400-e29b-41d4-a716-446655440000", nombre: "Sede Central" },
        { id: "550e8400-e29b-41d4-a716-446655440001", nombre: "Sede Norte" }
      ],
      tiposDeEvento: [
        { id: "550e8400-e29b-41d4-a716-446655440002", nombre: "Ludoteca Viajera" },
        { id: "550e8400-e29b-41d4-a716-446655440003", nombre: "Taller" }
      ],
      aliados: [
        { id: "550e8400-e29b-41d4-a716-446655440004", nombre: "Persona A" },
        { id: "550e8400-e29b-41d4-a716-446655440005", nombre: "Grupo de Interés B" },
        { id: "550e8400-e29b-41d4-a716-446655440006", nombre: "Aliado Cultivarte C" }
      ],
      responsables: [
        { id: "550e8400-e29b-41d4-a716-446655440007", nombre: "Responsable X" },
        { id: "550e8400-e29b-41d4-a716-446655440008", nombre: "Responsable Y" }
      ],
      nombreDeEventos: [
        { id_parametro_detalle: "550e8400-e29b-41d4-a716-446655440009", nombre: "Evento Anual" },
        { id_parametro_detalle: "550e8400-e29b-41d4-a716-446655440010", nombre: "Evento Mensual" }
      ],
      frecuencias: [
        { id: "550e8400-e29b-41d4-a716-446655440011", nombre: "Diaria" },
        { id: "550e8400-e29b-41d4-a716-446655440012", nombre: "Semanal" },
        { id: "550e8400-e29b-41d4-a716-446655440013", nombre: "Mensual" }
      ]
    },
    sesiones: [
      {
        id_evento: "f738-52ad-4b83-a588-34656",
        id_sesion: "2c45f738-52ad-4b83-a588-346568126948",
        fecha_sesion: "2025-08-20",
        hora_inicio: "16:00",
        hora_fin: "18:00",
        asistentes_sesion: 0
      },
      {
        id_evento: "f738-52ad-4b83-a588-34656",
        id_sesion: "03aebcca-4a86-4aea-a413-d398a8277d21",
        fecha_sesion: "2025-08-21",
        hora_inicio: "16:00",
        hora_fin: "18:00",
        asistentes_sesion: 2
      },
      {
        id_evento: "f738-52ad-4b83-a588-34656",
        id_sesion: "6ba30d47-4227-4a40-b1bf-7285e1d1f146",
        fecha_sesion: "2025-08-22",
        hora_inicio: "16:00",
        hora_fin: "18:00",
        asistentes_sesion: 3
      }
    ]
  }).pipe(delay(500)); // Simula tiempo de respuesta
}

  obtenerConfiguracionEvento(idUsuario: string): Observable<any> {
    console.log('📡 Solicitando configuración de evento para usuario:', idUsuario);

    // 🔹 Simulación de respuesta del backend
    const mockResponse = {
      id_programa: '9b-41d4-a716-446655',
      sedes: [
        { id: '550e8400-e29b-41d4-a716-446655440000', nombre: 'Sede Central' },
        { id: '550e8400-e29b-41d4-a716-446655440001', nombre: 'Sede Norte' }
      ],
      tiposDeEvento: [
        { id: '550e8400-e29b-41d4-a716-446655440002', nombre: 'Contenido del ciclo' },
        { id: '550e8400-e29b-41d4-a716-446655440003', nombre: 'Actividad general' },
        { id: '550e8400-e29b-41d4-a716-446655440004', nombre: 'Taller' }
      ],
      aliados: [
        { id: '550e8400-e29b-41d4-a716-446655440005', nombre: 'Persona A' },
        { id: '550e8400-e29b-41d4-a716-446655440006', nombre: 'Grupo de Interés B' },
        { id: '550e8400-e29b-41d4-a716-446655440007', nombre: 'Aliado Cultivarte C' }
      ],
      responsables: [
        { id: '550e8400-e29b-41d4-a716-446655440008', nombre: 'Responsable X' },
        { id: '550e8400-e29b-41d4-a716-446655440009', nombre: 'Responsable Y' }
      ],
      nombreDeEventos: [
        { id_parametro_detalle: '550e8400-e29b-41d4-a716-446655440010', nombre: 'Evento Anual' },
        { id_parametro_detalle: '550e8400-e29b-41d4-a716-446655440011', nombre: 'Evento Mensual' }
      ],
      frecuencias: [
        { id: '550e8400-e29b-41d4-a716-446655440012', nombre: 'A diario' },
        { id: '550e8400-e29b-41d4-a716-446655440013', nombre: 'Todos los dias de la semana' },
        { id: '550e8400-e29b-41d4-a716-446655440014', nombre: 'Semanalmente' },
        { id: '550e8400-e29b-41d4-a716-446655440015', nombre: 'Mensualmente' }
      ]
    };

    // 🔹 Simulación de delay de red
    return of(mockResponse).pipe(delay(500));
  }

  /**
   * 🔹 Envía al backend el evento para crearlo junto con sus sesiones
   * @param payload Objeto con la estructura que requiere el back
   */
  crearEvento(payload: any): Observable<any> {
    console.log('📤 Enviando evento al back:', payload);
    // console.log('📤 Datos que se enviarían al backend:', payload);

    // 🔹 Simulamos que el backend tarda 1 segundo en responder
    return of({
      exitoso: 'S',
      mensaje: 'Registro guardado exitosamente (mock)'
    }).pipe(delay(1000));

    // Si es REST:
    // return this.http.post<any>(`${this.apiUrl}/crear-evento`, payload);

    // Si es GraphQL (descomentar y ajustar):
    /*
    const query = `
      mutation CrearEvento($input: EventoInput!) {
        crearEvento(input: $input) {
          exitoso
          mensaje
        }
      }
    `;
    return this.http.post<any>(this.apiUrl, {
      query,
      variables: { input: payload }
    });
    */

    // 🔹 Para pruebas sin back:
    /*
    const mockResp = {
      exitoso: 'S',
      mensaje: 'Registro guardado exitosamente'
    };
    return of(mockResp).pipe(delay(800));
    */
  }
}

