import { indexDB } from '../services/database.service';
import { Sesiones } from '../interfaces/sesiones';
import { ActividadesDataSource } from './actividades-datasource';
import { Personas_sedesDataSource } from './personas_sedes-datasource';
import { Injectable } from '@angular/core';
import { Actividades } from '../interfaces/actividades';
@Injectable({
  providedIn: 'root'
})
export class SesionesDataSource {
  private actividades = new ActividadesDataSource();
  private personasSedes = new Personas_sedesDataSource();

  async getAll(): Promise<Sesiones[]> {
    return await indexDB.sesiones.toArray();
  }

  async getById(id: string): Promise<Sesiones | undefined> {
    return await indexDB.sesiones.get(id);
  }

  async create(data: Sesiones): Promise<string> {
    return await indexDB.sesiones.add(data);
  }

  async update(id: string, changes: Partial<Sesiones>): Promise<number> {
    return await indexDB.sesiones.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await indexDB.sesiones.delete(id);
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
  async getByRange(
    fechaInicio: Date,
    fechaFin: Date,
    idUsuario: string
  ): Promise<Sesiones[]> {
    // 1. Usar el método de actividades
    const sedesUsuario = await this.personasSedes.getSedesByUsuario(idUsuario);

    const actividades = await this.actividades.getBySedes(sedesUsuario);

    if (actividades.length === 0) return [];

    const idsActividades = actividades.map((a) => a.id_actividad);

    return await indexDB.sesiones
      .where('fecha_actividad')
      .between(fechaInicio, fechaFin, true, true)
      .filter((s:Sesiones) => idsActividades.includes(s.id_actividad))
      .toArray();
  }
  async sesionesPorActividad(id_actividad: string): Promise<Sesiones[]> {
    return await indexDB.sesiones
      .where('id_actividad')
      .equals(id_actividad)
      .toArray();
  }
}
