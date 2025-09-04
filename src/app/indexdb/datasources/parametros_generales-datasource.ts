import { indexDB } from '../services/database.service';
import { Parametros_generales } from '../interfaces/parametros_generales';

export class Parametros_generalesDataSource {
  async getAll(): Promise<Parametros_generales[]> {
    return await indexDB.parametros_generales.toArray();
  }

  async getById(id: string): Promise<Parametros_generales | undefined> {
    return await indexDB.parametros_generales.get(id);
  }

  async create(data: Parametros_generales): Promise<string> {
    return await indexDB.parametros_generales.add(data);
  }

  async update(id: string, changes: Partial<Parametros_generales>): Promise<number> {
    return await indexDB.parametros_generales.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await indexDB.parametros_generales.delete(id);
  }

  async bulkAdd(data: Parametros_generales[]): Promise<void> {
    this.deleteFull();
    const withSyncStatus = data.map(item => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced'
    }));
    await indexDB.parametros_generales.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.parametros_generales.clear();
  }
}
