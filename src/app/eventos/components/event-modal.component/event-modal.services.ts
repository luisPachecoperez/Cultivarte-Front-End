import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EventModalService {

  constructor() {}

  /**
   * 🗑️ Elimina un evento (solo si asistentes_evento == 0)
   */
  eliminarEvento(idEvento: string, asistentes_evento: number) {
    console.log('📤 Intentando eliminar evento:', { id_evento: idEvento, asistentes_evento });

    // ⛔ No permitir eliminar si tiene asistentes
    if (asistentes_evento > 0) {
      return throwError(() => ({
        exitoso: 'N',
        mensaje: 'No se puede eliminar un evento con asistentes registrados'
      }));
    }

    // ✅ Simulación exitosa
    return of({
      exitoso: 'S',
      mensaje: 'Registros eliminados exitosamente'
    }).pipe(delay(500));
  }
}
