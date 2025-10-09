import { DatabaseService } from '../../app/indexdb/services/database.service';
import Dexie from 'dexie';

describe('🧩 DatabaseService (Cobertura 100%)', () => {
  let service: DatabaseService;

  beforeEach(async () => {
    // Elimina la base anterior para evitar colisiones de versión
    await Dexie.delete('CultivarteAppIndexDB');
    service = new DatabaseService();
    await service.open(); // fuerza inicialización
  });

  afterEach(async () => {
    await service.close();
  });

  it('✅ debe crear la instancia y registrar stores', () => {
    expect(service).toBeTruthy();
    expect(service.name).toBe('CultivarteAppIndexDB');
    const schema = service._dbSchema;
    expect(schema).toBeDefined();
    expect(Object.keys(schema)).toContain('actividades');
    expect(Object.keys(schema)).toContain('sesiones');
  });

  it('📦 debe agregar y leer un registro de prueba', async () => {
    const item = {
      id_actividad: 'ACT-001',
      nombre_actividad: 'Test',
      id_programa: 'P1',
    };
    await service.actividades.add(item as any);
    const result = await service.actividades.get('ACT-001');
    expect(result?.nombre_actividad).toBe('Test');
  });

  it('🔁 debe poder cerrar y reabrir la base', async () => {
    await service.close();
    const reopened = new DatabaseService();
    await reopened.open();
    expect(reopened.isOpen()).toBeTrue();
    await reopened.close();
  });

  it('⚙️ debe definir todas las tablas esperadas', () => {
    const expected = [
      'actividades',
      'asistencias',
      'parametros_detalle',
      'parametros_generales',
      'personas',
      'personas_grupo_interes',
      'personas_programas',
      'personas_sedes',
      'poblaciones',
      'sedes',
      'sesiones',
    ];
    expected.forEach((t) => expect((service as any)[t]).toBeDefined());
  });

  it('🧱 debe simular una versión 2 con nuevo store para cubrir toda la rama', async () => {
    // ⚙️ Simulamos una segunda versión para cubrir otra rama del constructor
    class ExtendedDatabaseService extends DatabaseService {
      constructor() {
        super();
        this.version(2).stores({
          logs: 'id_log, mensaje, fecha',
        });
      }
    }

    const extended = new ExtendedDatabaseService();
    await extended.open();

    // Agregamos un registro al nuevo store "logs"
    const log = { id_log: 'L1', mensaje: 'Versión 2', fecha: new Date().toISOString() };
    await extended.table('logs').add(log);
    const saved = await extended.table('logs').get('L1');
    expect(saved?.mensaje).toBe('Versión 2');

    await extended.close();
  });
});
