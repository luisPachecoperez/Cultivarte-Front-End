import { indexDB } from '../services/database.service';
import { Aliados } from '../interfaces/aliados';

export class AliadosDataSource {
  async getAll(): Promise<Aliados[]> {
    return await indexDB.aliados.toArray();
  }

  async getById(id: string): Promise<Aliados | undefined> {
    return await indexDB.aliados.get(id);
  }

  async bulkAdd(data: Aliados[]): Promise<void> {
    this.deleteFull();
    const withSyncStatus = data.map(item => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced'
    }));
    await indexDB.aliados.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.aliados.clear();
  }
}
