import { Poblaciones } from '../interfaces/poblaciones';

export class PoblacionesMapper {
  static toDomain(row: any): Poblaciones {
    return {
      id_poblacion: row.id_poblacion,
      id_padre: row.id_padre,
      nombre: row.nombre
    } as Poblaciones;
  }

  static toPersistence(entity: Poblaciones): any {
    return {
      id_poblacion: entity.id_poblacion,
      id_padre: entity.id_padre,
      nombre: entity.nombre
    };
  }
}
