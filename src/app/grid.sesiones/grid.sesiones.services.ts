import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GridSesionesService {

  constructor() {}

  /**
   * 📤 Envía cambios de sesiones al backend
   * @param payload Objeto con arrays: nuevos, modificados, eliminados
   */
  guardarCambiosSesiones(payload: any): Observable<any> {
    console.log('📤 Payload de sesiones al back:', payload);

    // 🔹 Mock de respuesta del backend
    if (payload.eliminados.some((s: any) => s.id_sesion === '7dde5fee-c5ff-421e-a054-5e9189dd048c')) {
      return of({
        exitoso: 'N',
        mensaje: 'Sesion tiene asistentes'
      }).pipe(delay(800));
    }

    return of({
      exitoso: 'S',
      mensaje: 'Registro guardado exitosamente'
    }).pipe(delay(800));
  }
}
