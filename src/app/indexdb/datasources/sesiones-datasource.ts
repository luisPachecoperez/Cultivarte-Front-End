import { indexDB } from '../services/database.service';
import { Sesiones } from '../interfaces/sesiones';
import { Injectable } from '@angular/core';
import { GraphQLResponse } from '../../shared/interfaces/graphql-response.model';
@Injectable({
  providedIn: 'root',
})
export class SesionesDataSource {
  constructor() {}
  async getAll(): Promise<Sesiones[]> {
    return await indexDB.sesiones.toArray();
  }

  async getById(id: string): Promise<Sesiones | undefined> {
    return await indexDB.sesiones.get(id);
  }

  async create(data: Sesiones): Promise<GraphQLResponse> {
    if (
      typeof data.fecha_actividad === 'string' &&
      data.fecha_actividad.includes('-')
    ) {
      // ✅ Caso fecha tipo string con guiones → convertir a timestamp
      data.fecha_actividad = String(new Date(data.fecha_actividad).getTime());
    }

    console.log('adicionando sesion al index:', data);
    await indexDB.sesiones.add(data);
    return {
      exitoso: 'S',
      mensaje: `Registro adicionado`,
    };
  }

  async update(
    id: string,
    changes: Partial<Sesiones>
  ): Promise<GraphQLResponse> {
    if (
      changes.fecha_actividad &&
      typeof changes.fecha_actividad === 'string' &&
      changes.fecha_actividad.includes('-')
    ) {
      changes.fecha_actividad = String(
        new Date(changes.fecha_actividad).getTime()
      );
    }

    // 🔹 Traer registro actual
    const current = await indexDB.sesiones.get(id);

    if (!current) {
      return {
        exitoso: 'N',
        mensaje: `No se encontró sesión con id=${id}`,
      };
    }

    // 🔹 Si estaba pendiente de creación → mantener create
    if (changes.syncStatus === 'synced') {
      await indexDB.sesiones.update(id,changes);
    } else {
      if (current.syncStatus === 'pending-create') {
        await indexDB.sesiones.update(id, {
          ...changes,
          syncStatus: 'pending-create', // 👈 no cambiar
        });
      } else {
        // 🔹 Si estaba synced → pasa a pendiente de update
        await indexDB.sesiones.update(id, {
          ...changes,
          syncStatus: 'pending-update', // 👈 marcar update
        });
      }
    }
    return {
      exitoso: 'S',
      mensaje: `Registro actualizado`,
    };
  }

  async delete(id: string, soft: boolean): Promise<GraphQLResponse> {
    if (soft) {
      await indexDB.sesiones.update(id, { deleted: true });
    } else {
      await indexDB.sesiones.delete(id);
    }
    return {
      exitoso: 'S',
      mensaje: `Registro ${id} marcado como eliminado`,
    };
  }

  async bulkAdd(data: Sesiones[]): Promise<void> {
    this.deleteFull();

    const withSyncStatus = data.map((item) => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced',
    }));
    await indexDB.sesiones.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.sesiones.clear();
  }

  // 🔹 Nuevo método getByRange

  async sesionesPorActividad(id_actividad: string): Promise<Sesiones[]> {
    return await indexDB.sesiones
      .where('id_actividad')
      .equals(id_actividad)
      .toArray();
  }
}
