import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private apiUrl = 'http://localhost:3000/api/asistencia'; // 👈 Ajusta a tu backend real

  // ✅ Activa o desactiva el modo mock
  private usarMock = true;

  constructor(private http: HttpClient) {}

  // 🔹 Consultar info de asistencia según id_evento
  obtenerDetalleAsistencia(id_evento: string): Observable<any> {
    if (this.usarMock) {
      console.log('📥 [MOCK] obteniendo detalle de asistencia para:', id_evento);

      const mockResponse = {
        id_evento: "550e8400-e29b446655440000",
        id_sesion: "550e-e29b4466554400",
        id_sede: "550e8400-e29b-41d4-a716-446655440000",
        numero_asistentes: 0,
        foto: "S", // 👈 Cambia a "N" para probar asistencia normal
        imagen: "https://storage.googleapis.com/[BUCKET_NAME]/[IMAGE_NAME]",
        sedes: [
          { id_sede: "550e8400-e29b-41d4-a716-446655440001", nombre_sede: "Sede Central" },
          { id_sede: "550e8400-e29b-41d4-a716-446655440002", nombre_sede: "Sede Norte" }
        ],
        beneficiarios: [
          {
            id_persona: "123e4567-e89b-12d3-a456-426614174000",
            nombre_completo: "Juan Pérez",
            id_sede: "550e8400-e29b-41d4-a716-446655440001"
          },
          {
            id_persona: "123e4567-e89b-12d3-a456-426614174001",
            nombre_completo: "María López",
            id_sede: "550e8400-e29b-41d4-a716-446655440002"
          }
        ],
        asistentes_sesiones: [
          { id_persona: "123e4567-e89b-12d3-a456-426614174002" },
          { id_persona: "123e4567-e89b-12d3-a456-426614174003" }
        ]
      };

      return of(mockResponse).pipe(delay(800));
    }

    // 👇 cuando tengas backend real, quita el mock y usa esto
    return this.http.post<any>(`${this.apiUrl}/detalle`, { id_evento });
  }

  // 🔹 Guardar asistencia normal
  guardarAsistencia(asistencia: any): Observable<any> {
    if (this.usarMock) {
      console.log('📤 [MOCK] guardando asistencia normal:', asistencia);
      return of({ exitoso: "S", mensaje: "Asistencia guardada exitosamente" }).pipe(delay(500));
    }

    return this.http.post<any>(`${this.apiUrl}/guardar`, asistencia);
  }

  // 🔹 Guardar asistencia fotográfica
  guardarAsistenciaFotografica(asistencia: any): Observable<any> {
    if (this.usarMock) {
      console.log('📤 [MOCK] guardando asistencia fotográfica:', asistencia);
      return of({ exitoso: "S", mensaje: "Asistencia fotográfica guardada exitosamente" }).pipe(delay(500));
    }

    return this.http.post<any>(`${this.apiUrl}/guardar-fotografica`, asistencia);
  }
}
