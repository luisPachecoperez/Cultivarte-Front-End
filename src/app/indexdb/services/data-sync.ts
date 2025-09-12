import { Injectable } from '@angular/core';
import { interval, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { indexDB } from './database.service';
@Injectable({ providedIn: 'root' })
export class DataSyncService {
  private readonly PING_QUERY = `
    query Ping {
      ping
    }
  `;

  constructor(private http: HttpClient) {}

  /**
   * Inicia el proceso de sincronización en background
   */
  startSync() {
    interval(5000)
      .pipe(
        switchMap(() => from(this.syncPending()))
      )
      .subscribe();
  }

  /**
   * Revisa si hay datos pendientes y los sincroniza con el backend
   */
  private async syncPending() {
    console.log('🔍 Revisando datos pendientes en IndexedDB...');

    // 1. Verificar si backend responde
    const backendActivo = await this.pingBackend();
    if (!backendActivo) {
      console.warn('⚠️ Backend inactivo, no se sincroniza todavía');
      return;
    }
/*
    // 2. Buscar sesiones pendientes
    const sesionesPendientes = await indexDB.sesiones
      .where('syncStatus')
      .equals('pending-')
      .toArray();

    if (sesionesPendientes.length > 0) {
      console.log('🔄 Sincronizando sesiones pendientes:', sesionesPendientes);

      try {
        await this.http
          .post<any>('/graphql', {
            query: `
              mutation UpdateSesiones($input: [SesionInput!]!) {
                updateSesiones(input: $input) {
                  exitoso
                  mensaje
                }
              }
            `,
            variables: { input: sesionesPendientes },
          })
          .toPromise();

        // 3. Marcar como synced
        for (const s of sesionesPendientes) {
          await indexDB.sesiones.update(s.id_sesion, { syncStatus: 'synced' });
        }

        console.log('✅ Sesiones sincronizadas con backend');
      } catch (err) {
        console.error('❌ Error al sincronizar sesiones:', err);
      }
    }*/
  }

  /**
   * Verifica si el backend está activo
   */
  private async pingBackend(): Promise<boolean> {
    try {
      const res = await this.http
        .post<any>('/graphql', { query: this.PING_QUERY })
        .toPromise();

      return res?.data?.ping === 'pong';
    } catch {
      return false;
    }
  }
}
