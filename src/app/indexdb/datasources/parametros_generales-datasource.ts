import { indexDB } from '../services/database.service';
import { Parametros_generalesDB } from '../interfaces/parametros_generales.interface';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Parametros_generalesDataSource {
  async getAll(): Promise<Parametros_generalesDB[]> {
    return await indexDB.parametros_generales.toArray();
  }

  async getById(id: string): Promise<Parametros_generalesDB | undefined> {
    return await indexDB.parametros_generales.get(id);
  }

  async create(data: Parametros_generalesDB): Promise<string> {
    return await indexDB.parametros_generales.add(data);
  }

  async update(
    id: string,
    changes: Partial<Parametros_generalesDB>,
  ): Promise<number> {
    return await indexDB.parametros_generales.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await indexDB.parametros_generales.delete(id);
  }

  async bulkAdd(data: Parametros_generalesDB[]): Promise<void> {
    await this.deleteFull();
    const withSyncStatus = data.map((item) => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced',
    }));
    await indexDB.parametros_generales.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.parametros_generales.clear();
  }
}
