import { indexDB } from '../services/database.service';
import { Personas_sedes } from '../interfaces/personas_sedes.interface';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Personas_sedesDataSource {
  async getAll(): Promise<Personas_sedes[]> {
    return await indexDB.personas_sedes.toArray();
  }

  async getById(id: string): Promise<Personas_sedes | undefined> {
    return await indexDB.personas_sedes.get(id);
  }

  async create(data: Personas_sedes): Promise<string> {
    return await indexDB.personas_sedes.add(data);
  }

  async update(id: string, changes: Partial<Personas_sedes>): Promise<number> {
    return await indexDB.personas_sedes.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await indexDB.personas_sedes.delete(id);
  }

  async bulkAdd(data: Personas_sedes[]): Promise<void> {
    this.deleteFull();

    const withSyncStatus = data.map(item => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced'
    }));
    //console.log('Bulk adding personas_sedes:', withSyncStatus);
    await indexDB.personas_sedes.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.personas_sedes.clear();
  }

  async getSedesByUsuario(idUsuario: string): Promise<string[]> {

    const registros = await indexDB.personas_sedes
      .where('id_persona')
      .equals(idUsuario)
      .toArray();
    //console.log('IndexDB Registros encontrados:', registros);
    return registros.map(r => r.id_sede);
  }
}
