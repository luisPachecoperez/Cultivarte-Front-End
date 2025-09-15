import { indexDB } from '../services/database.service';
import { Parametros_detalle } from '../interfaces/parametros_detalle';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Parametros_detalleDataSource {
  async getAll(): Promise<Parametros_detalle[]> {
    return await indexDB.parametros_detalle.toArray();
  }

  async getById(id: string): Promise<Parametros_detalle | undefined> {
    return await indexDB.parametros_detalle.get(id);
  }

  async create(data: Parametros_detalle): Promise<string> {
    return await indexDB.parametros_detalle.add(data);
  }

  async update(id: string, changes: Partial<Parametros_detalle>): Promise<number> {
    return await indexDB.parametros_detalle.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await indexDB.parametros_detalle.delete(id);
  }

  async bulkAdd(data: Parametros_detalle[]): Promise<void> {

    this.deleteFull();
    const withSyncStatus = data.map(item => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced'
    }));
    console.log('Response Parámetros Detalle:', withSyncStatus);

    await indexDB.parametros_detalle.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.parametros_detalle.clear();
  }
}
