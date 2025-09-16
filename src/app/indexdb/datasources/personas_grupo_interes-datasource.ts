import { indexDB } from '../services/database.service';
import { Personas_grupo_interes } from '../interfaces/personas_grupo_interes.interface';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Personas_grupo_interesDataSource {
  async getAll(): Promise<Personas_grupo_interes[]> {
    return await indexDB.personas_grupo_interes.toArray();
  }

  async getById(id: string): Promise<Personas_grupo_interes | undefined> {
    return await indexDB.personas_grupo_interes.get(id);
  }

  async create(data: Personas_grupo_interes): Promise<string> {
    return await indexDB.personas_grupo_interes.add(data);
  }

  async update(id: string, changes: Partial<Personas_grupo_interes>): Promise<number> {
    return await indexDB.personas_grupo_interes.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await indexDB.personas_grupo_interes.delete(id);
  }

  async bulkAdd(data: Personas_grupo_interes[]): Promise<void> {
    this.deleteFull();
    const withSyncStatus = data.map(item => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced'
    }));
    await indexDB.personas_grupo_interes.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.personas_grupo_interes.clear();
  }
}
