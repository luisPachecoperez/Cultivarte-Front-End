import { indexDB } from '../services/database.service';
import { PersonasGrupoInteresDB } from '../interfaces/personas_grupo_interes.interface';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PersonasGrupoInteresDataSource {
  async getAll(): Promise<PersonasGrupoInteresDB[]> {
    return await indexDB.personas_grupo_interes.toArray();
  }

  async getById(id: string): Promise<PersonasGrupoInteresDB | undefined> {
    return await indexDB.personas_grupo_interes.get(id);
  }

  async create(data: PersonasGrupoInteresDB): Promise<string> {
    return await indexDB.personas_grupo_interes.add(data);
  }

  async update(
    id: string,
    changes: Partial<PersonasGrupoInteresDB>,
  ): Promise<number> {
    return await indexDB.personas_grupo_interes.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await indexDB.personas_grupo_interes.delete(id);
  }

  async bulkAdd(data: PersonasGrupoInteresDB[]): Promise<void> {
    const withSyncStatus = data.map((item) => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced',
    }));
    await indexDB.personas_grupo_interes.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.personas_grupo_interes.clear();
  }
}
