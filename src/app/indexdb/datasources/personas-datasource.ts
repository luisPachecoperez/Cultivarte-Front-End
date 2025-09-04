import { indexDB } from '../services/database.service';
import { Personas } from '../interfaces/personas';

export class AliadosDataSource {
  async getAll(): Promise<Personas[]> {
    return await indexDB.personas.toArray();
  }

  async getById(id: string): Promise<Personas | undefined> {
    return await indexDB.personas.get(id);
  }

  async bulkAdd(data: Personas[]): Promise<void> {
    this.deleteFull();
    const withSyncStatus = data.map(item => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced'
    }));
    await indexDB.personas.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.personas.clear();
  }
}
