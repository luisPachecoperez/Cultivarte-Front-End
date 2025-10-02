import { indexDB } from '../services/database.service';
import { Personas_programasDB } from '../interfaces/personas_programas.interface';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Personas_programasDataSource {
  async getAll(): Promise<Personas_programasDB[]> {
    return await indexDB.personas_programas.toArray();
  }

  async getById(id: string): Promise<Personas_programasDB | undefined> {
    return await indexDB.personas_programas.get(id);
  }

  async create(data: Personas_programasDB): Promise<string> {
    return await indexDB.personas_programas.add(data);
  }

  async update(
    id: string,
    changes: Partial<Personas_programasDB>,
  ): Promise<number> {
    return await indexDB.personas_programas.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await indexDB.personas_programas.delete(id);
  }

  async bulkAdd(data: Personas_programasDB[]): Promise<void> {
    await this.deleteFull();
    const withSyncStatus = data.map((item) => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced',
    }));
    await indexDB.personas_programas.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.personas_programas.clear();
  }
}
