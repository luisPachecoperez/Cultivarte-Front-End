import { indexDB } from '../services/database.service';
import { Sessions } from '../interfaces/sessions';

export class SessionsDataSource {
  async getAll(): Promise<Sessions[]> {
    return await indexDB.sessions.toArray();
  }

  async getById(id: string): Promise<Sessions | undefined> {
    return await indexDB.sessions.get(id);
  }

  async create(data: Sessions): Promise<string> {
    return await indexDB.sessions.add(data);
  }

  async update(id: string, changes: Partial<Sessions>): Promise<number> {
    return await indexDB.sessions.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await indexDB.sessions.delete(id);
  }

  async bulkAdd(data: Sessions[]): Promise<void> {
    this.deleteFull();
    const withSyncStatus = data.map(item => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced'
    }));
    await indexDB.sessions.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.sessions.clear();
  }
}
