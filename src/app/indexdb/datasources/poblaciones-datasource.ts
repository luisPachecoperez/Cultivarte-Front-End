import { indexDB } from '../services/database.service';
import { PoblacionesDB } from '../interfaces/poblaciones.interface';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PoblacionesDataSource {
  async getAll(): Promise<PoblacionesDB[]> {
    return await indexDB.poblaciones.toArray();
  }

  async getById(id: string): Promise<PoblacionesDB | undefined> {
    return await indexDB.poblaciones.get(id);
  }

  async create(data: PoblacionesDB): Promise<string> {
    return await indexDB.poblaciones.add(data);
  }

  async update(id: string, changes: Partial<PoblacionesDB>): Promise<number> {
    return await indexDB.poblaciones.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await indexDB.poblaciones.delete(id);
  }

  async bulkAdd(data: PoblacionesDB[]): Promise<void> {
    await this.deleteFull();
    const withSyncStatus = data.map((item) => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced',
    }));
    await indexDB.poblaciones.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.poblaciones.clear();
  }
}
