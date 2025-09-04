import { indexDB } from '../services/database.service';
import { Poblaciones } from '../interfaces/poblaciones';

export class PoblacionesDataSource {
  async getAll(): Promise<Poblaciones[]> {
    return await indexDB.poblaciones.toArray();
  }

  async getById(id: string): Promise<Poblaciones | undefined> {
    return await indexDB.poblaciones.get(id);
  }

  async create(data: Poblaciones): Promise<string> {
    return await indexDB.poblaciones.add(data);
  }

  async update(id: string, changes: Partial<Poblaciones>): Promise<number> {
    return await indexDB.poblaciones.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await indexDB.poblaciones.delete(id);
  }

  async bulkAdd(data: Poblaciones[]): Promise<void> {
    this.deleteFull();
    const withSyncStatus = data.map(item => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced'
    }));
    await indexDB.poblaciones.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.poblaciones.clear();
  }
}
