import { indexDB } from '../services/database.service';
import { PersonasProgramasDB } from '../interfaces/personas_programas.interface';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PersonasProgramasDataSource {
  async getAll(): Promise<PersonasProgramasDB[]> {
    return await indexDB.personas_programas.toArray();
  }

  async getById(id: string): Promise<PersonasProgramasDB | undefined> {
    return await indexDB.personas_programas.get(id);
  }

  async create(data: PersonasProgramasDB): Promise<string> {
    return await indexDB.personas_programas.add(data);
  }

  async update(
    id: string,
    changes: Partial<PersonasProgramasDB>,
  ): Promise<number> {
    return await indexDB.personas_programas.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await indexDB.personas_programas.delete(id);
  }

  async bulkAdd(data: PersonasProgramasDB[]): Promise<void> {
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
