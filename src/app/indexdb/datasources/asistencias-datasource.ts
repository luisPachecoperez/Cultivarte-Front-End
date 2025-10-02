import { indexDB } from '../services/database.service';
import { AsistenciasDB } from '../interfaces/asistencias.interface';
import { Injectable } from '@angular/core';
import { GraphQLResponse } from '../../shared/interfaces/graphql-response.interface';

@Injectable({
  providedIn: 'root',
})
export class AsistenciasDataSource {
  async getAll(): Promise<AsistenciasDB[]> {
    return await indexDB.asistencias.toArray();
  }

  async getById(id: string): Promise<AsistenciasDB | undefined> {
    return await indexDB.asistencias.get(id);
  }

  async create(data: AsistenciasDB): Promise<GraphQLResponse> {
    await indexDB.asistencias.add(data);
    return {
      exitoso: 'S',
      mensaje: `Registro adicionado`,
    };
  }

  async update(
    id: string,
    changes: Partial<AsistenciasDB>,
  ): Promise<GraphQLResponse> {
    await indexDB.asistencias.update(id, changes);
    return {
      exitoso: 'S',
      mensaje: `Registro actualizado`,
    };
  }

  async delete(id: string, soft: boolean): Promise<GraphQLResponse> {
    if (soft) {
      await indexDB.asistencias.update(id, { deleted: true });
    } else {
      await indexDB.asistencias.delete(id);
    }
    return {
      exitoso: 'S',
      mensaje: `Registro actualizado`,
    };
  }

  async bulkAdd(data: AsistenciasDB[]): Promise<void> {
    const withSyncStatus = data.map((item) => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced',
    }));
    await indexDB.asistencias.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.asistencias.clear();
  }
}
