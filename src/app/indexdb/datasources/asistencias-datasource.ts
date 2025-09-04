import { indexDB } from '../services/database.service';
import { Asistencias } from '../interfaces/asistencias';

export class AsistenciasDataSource {
  async getAll(): Promise<Asistencias[]> {
    return await indexDB.asistencias.toArray();
  }

  async getById(id: string): Promise<Asistencias | undefined> {
    return await indexDB.asistencias.get(id);
  }

  async create(data: Asistencias): Promise<string> {
    return await indexDB.asistencias.add(data);
  }

  async update(id: string, changes: Partial<Asistencias>): Promise<number> {
    return await indexDB.asistencias.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await indexDB.asistencias.delete(id);
  }

  async bulkAdd(data: Asistencias[]): Promise<void> {
    this.deleteFull();
    const withSyncStatus = data.map(item => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced'
    }));
    await indexDB.asistencias.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.asistencias.clear();
  }
}
