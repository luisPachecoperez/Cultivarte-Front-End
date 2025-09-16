import { indexDB } from '../services/database.service';
import { Sedes } from '../interfaces/sedes.interface';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SedesDataSource {
  async getAll(): Promise<Sedes[]> {
    return await indexDB.sedes.toArray();
  }

  async getById(id: string): Promise<Sedes | undefined> {
    return await indexDB.sedes.get(id);
  }

  async create(data: Sedes): Promise<string> {
    return await indexDB.sedes.add(data);
  }

  async update(id: string, changes: Partial<Sedes>): Promise<number> {
    return await indexDB.sedes.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await indexDB.sedes.delete(id);
  }

  async bulkAdd(data: Sedes[]): Promise<void> {
    this.deleteFull();
    const withSyncStatus = data.map(item => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced'
    }));
    await indexDB.sedes.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.sedes.clear();
  }
}
