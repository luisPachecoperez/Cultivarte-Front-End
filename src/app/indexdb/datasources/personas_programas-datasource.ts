import { indexDB } from '../services/database.service';
import { Personas_programas } from '../interfaces/personas_programas';

export class Personas_programasDataSource {
  async getAll(): Promise<Personas_programas[]> {
    return await indexDB.personas_programas.toArray();
  }

  async getById(id: string): Promise<Personas_programas | undefined> {
    return await indexDB.personas_programas.get(id);
  }

  async create(data: Personas_programas): Promise<string> {
    return await indexDB.personas_programas.add(data);
  }

  async update(id: string, changes: Partial<Personas_programas>): Promise<number> {
    return await indexDB.personas_programas.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await indexDB.personas_programas.delete(id);
  }

  async bulkAdd(data: Personas_programas[]): Promise<void> {
    this.deleteFull();
    const withSyncStatus = data.map(item => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced'
    }));
    await indexDB.personas_programas.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.personas_programas.clear();
  }
}
