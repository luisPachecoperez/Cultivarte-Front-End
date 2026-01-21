import { indexDB } from '../services/database.service';
import { ParametrosDetalleDB } from '../interfaces/parametros_detalle.interface';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ParametrosDetalleDataSource {
  async getAll(): Promise<ParametrosDetalleDB[]> {
    return await indexDB.parametros_detalle.toArray();
  }

  async getById(id: string): Promise<ParametrosDetalleDB | undefined> {
    return await indexDB.parametros_detalle.get(id);
  }

  async create(data: ParametrosDetalleDB): Promise<string> {
    return await indexDB.parametros_detalle.add(data);
  }

  async update(
    id: string,
    changes: Partial<ParametrosDetalleDB>,
  ): Promise<number> {
    return await indexDB.parametros_detalle.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await indexDB.parametros_detalle.delete(id);
  }

  async bulkAdd(data: ParametrosDetalleDB[]): Promise<void> {
    await this.deleteFull();
    const withSyncStatus = data.map((item) => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced',
    }));

    await indexDB.parametros_detalle.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.parametros_detalle.clear();
  }
}
