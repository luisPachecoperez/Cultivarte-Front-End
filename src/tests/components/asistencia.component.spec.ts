import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { AsistenciaComponent } from '../../app/asistencia/asistencia-lista/pages/asistencia.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AsistenciaService } from '../../app/asistencia/asistencia-lista/services/asistencia.service';
import { SnackbarService } from '../../app/shared/services/snackbar.service';
import { Sesiones } from '../../app/eventos/interfaces/sesiones.interface';
import { PreAsistencia } from '../../app/asistencia/interfaces/pre-asistencia.interface';
import { Beneficiarios } from '../../app/eventos/interfaces/lista-beneficiarios.interface';

// ---- Mock Services con Jest ----
const asistenciaServiceMock = {
  obtenerDetalleAsistencia: jest.fn(),
  guardarAsistencia: jest.fn(),
};

const snackbarMock = {
  success: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
};

describe('✅ AsistenciaComponent (Jest)', () => {
  it('debe asignar imagen y descripcion como cadenas vacías en el payload', async () => {
    const mockSesion: Sesiones = { id_sesion: '1', id_actividad: '2' } as any;
    fixture.componentRef.setInput('evento', mockSesion);

    component.asistenciaForm.setValue({ id_sede: '1', descripcion: '' });
    component.asistentes = [{ id_persona: '1', eliminar: 'S' }] as any;

    asistenciaServiceMock.guardarAsistencia.mockResolvedValueOnce({ exitoso: 'S' });

    await component.guardarAsistencia();

    const callArg = asistenciaServiceMock.guardarAsistencia.mock.calls[0][0];
    expect(callArg.imagen).toBe('');
    expect(callArg.descripcion).toBe('');
  });
  it('debe asignar descripcion como cadena vacía en el payload', async () => {
    const mockSesion: Sesiones = { id_sesion: '1', id_actividad: '2' } as any;
    fixture.componentRef.setInput('evento', mockSesion);

    component.asistenciaForm.setValue({ id_sede: '1', descripcion: '' });
    component.asistentes = [{ id_persona: '1', eliminar: 'S' }] as any;

    asistenciaServiceMock.guardarAsistencia.mockResolvedValueOnce({ exitoso: 'S' });

    await component.guardarAsistencia();

    const callArg = asistenciaServiceMock.guardarAsistencia.mock.calls[0][0];
    expect(callArg.descripcion).toBe('');
  });
    it('debe asignar descripcion como cadena vacía en el payload si el valor del formulario es undefined', async () => {
      const mockSesion: Sesiones = { id_sesion: '1', id_actividad: '2' } as any;
      fixture.componentRef.setInput('evento', mockSesion);

    // No se establece descripcion en el formulario
    component.asistenciaForm.patchValue({ id_sede: '1' });
      component.asistentes = [{ id_persona: '1', eliminar: 'S' }] as any;

      asistenciaServiceMock.guardarAsistencia.mockResolvedValueOnce({ exitoso: 'S' });

      await component.guardarAsistencia();

      const callArg = asistenciaServiceMock.guardarAsistencia.mock.calls[0][0];
      expect(callArg.descripcion).toBe('');
    });
  it('debe asignar cadena vacía si id_sesion es undefined', async () => {
    fixture.componentRef.setInput('evento', { id_actividad: 'X' } as any); // sin id_sesion
    asistenciaServiceMock.obtenerDetalleAsistencia.mockResolvedValueOnce({});

    await component.ngOnInit();

    expect(asistenciaServiceMock.obtenerDetalleAsistencia).toHaveBeenCalledWith('');
  });
  it('debe asignar "S" como valor por defecto en eliminar si no existe en el asistente', async () => {
    const mockSesion: Sesiones = { id_sesion: '1', id_actividad: '2' } as any;
    fixture.componentRef.setInput('evento', mockSesion);

    // El asistente no tiene campo eliminar
    const asistentes = [{ id_persona: '999' }];
    const mockData: PreAsistencia = {
      id_sesion: '1',
      asistentes_sesiones: asistentes,
      beneficiarios: [],
      sedes: [],
    } as any;

    asistenciaServiceMock.obtenerDetalleAsistencia.mockResolvedValueOnce(mockData);

    await component.ngOnInit();

    expect(component.asistentes[0].eliminar).toBe('S');
  });
  it('debe asignar "Desconocido" si no existe beneficiario para el asistente', async () => {
    const mockSesion: Sesiones = { id_sesion: '1', id_actividad: '2' } as any;
    fixture.componentRef.setInput('evento', mockSesion);

    // El asistente no tiene beneficiario en la lista
    const asistentes = [{ id_persona: '999', eliminar: 'S' }];
    const mockData: PreAsistencia = {
      id_sesion: '1',
      asistentes_sesiones: asistentes,
      beneficiarios: [],
      sedes: [],
    } as any;

    asistenciaServiceMock.obtenerDetalleAsistencia.mockResolvedValueOnce(mockData);

    await component.ngOnInit();

    expect(component.asistentes[0].nombre_completo).toBe('Desconocido');
  });
  it('debe inicializar sedes como array vacío si data.sedes es undefined', async () => {
    const mockSesion: Sesiones = { id_sesion: '1', id_actividad: '2' } as any;
    fixture.componentRef.setInput('evento', mockSesion);
    asistenciaServiceMock.obtenerDetalleAsistencia.mockResolvedValueOnce({});

    await component.ngOnInit();

    expect(component.sedes).toEqual([]);
  });
  let component: AsistenciaComponent;
  let fixture: ComponentFixture<AsistenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        AsistenciaComponent,
      ],
      providers: [
        { provide: AsistenciaService, useValue: asistenciaServiceMock },
        { provide: SnackbarService, useValue: snackbarMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AsistenciaComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------
  it('✅ debe crear el componente', () => {
    expect(component).toBeTruthy();
    expect(component.asistenciaForm).toBeDefined();
  });

  // ---------------------------------------------------------------------
  it('⚙️ ngOnInit() no debe llamar servicio si evento es undefined', async () => {
    fixture.componentRef.setInput('evento', undefined);
    asistenciaServiceMock.obtenerDetalleAsistencia.mockReset();

    await component.ngOnInit();
    expect(
      asistenciaServiceMock.obtenerDetalleAsistencia,
    ).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------
  it('📥 ngOnInit() debe cargar datos de asistencia y precargar formulario', async () => {
    const mockSesion: Sesiones = { id_sesion: '10', id_actividad: '20' } as any;
    const beneficiarios: Beneficiarios[] = [
      {
        id_persona: '1',
        nombre_completo: 'Ana Pérez',
        id_sede: '1',
        identificacion: '123',
      },
      {
        id_persona: '2',
        nombre_completo: 'Luis Díaz',
        id_sede: '2',
        identificacion: '456',
      },
    ];

    const asistentes = [
      { id_persona: '1', eliminar: 'S' },
      { id_persona: '2', eliminar: 'N' },
    ] as any[];

    const mockData: PreAsistencia = {
      id_sesion: '10',
      id_sede: '1',
      descripcion: 'Evento prueba',
      numero_asistentes: 2,
      imagen: null,
      beneficiarios,
      asistentes_sesiones: asistentes,
      sedes: [{ id_sede: '1', nombre: 'Sede Norte' }],
      foto: null,
    };

    fixture.componentRef.setInput('evento', mockSesion);
    asistenciaServiceMock.obtenerDetalleAsistencia.mockResolvedValueOnce(
      mockData,
    );

    await component.ngOnInit();

    expect(asistenciaServiceMock.obtenerDetalleAsistencia).toHaveBeenCalledWith(
      '10',
    );
    expect(component.beneficiariosBD.length).toBe(2);
    expect(component.asistentes.length).toBe(2);
    expect(component.sedes.length).toBe(1);
    expect(component.asistenciaForm.value.id_sede).toBe('1');
  });

  // ---------------------------------------------------------------------
  it('❌ ngOnInit() debe manejar error en obtenerDetalleAsistencia', fakeAsync(() => {
    const mockSesion: Sesiones = { id_sesion: 'ERR', id_actividad: 'X' } as any;
    fixture.componentRef.setInput('evento', mockSesion);
    asistenciaServiceMock.obtenerDetalleAsistencia.mockRejectedValueOnce(
      'Error simulado',
    );
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    component.ngOnInit();
    tick();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '❌ Error desde Promise:',
      'Error simulado',
    );
    consoleErrorSpy.mockRestore();
  }));

  // ---------------------------------------------------------------------
  it('🔍 resultadosBusqueda() debe filtrar correctamente por texto y sede', () => {
    component.beneficiariosBD = [
      {
        id_persona: '1',
        nombre_completo: 'Ana María',
        id_sede: '1',
        identificacion: '111',
      },
      {
        id_persona: '2',
        nombre_completo: 'Pedro López',
        id_sede: '2',
        identificacion: '222',
      },
    ] as any;

    component.asistenciaForm.patchValue({ id_sede: '1' });
    component.filtro.setValue('ana');
    const res = component.resultadosBusqueda;

    expect(res.length).toBe(1);
    expect(res[0].nombre_completo).toBe('Ana María');
  });

  // ---------------------------------------------------------------------
  it('🔍 resultadosBusqueda() debe devolver vacío si no hay texto', () => {
    component.filtro.setValue('');
    expect(component.resultadosBusqueda).toEqual([]);
  });

  // ---------------------------------------------------------------------
  it('➕ agregarAsistente() debe agregar uno nuevo', () => {
    component.asistentes = [];
    const ben: Beneficiarios = {
      id_persona: '123',
      nombre_completo: 'Juan',
      id_sede: '1',
    } as any;

    component.agregarAsistente(ben);
    expect(component.asistentes.length).toBe(1);
    expect(component.asistentes[0].nombre_completo).toBe('Juan');
  });

  // ---------------------------------------------------------------------
  it('🚫 agregarAsistente() no debe duplicar asistentes', () => {
    const ben: Beneficiarios = {
      id_persona: '123',
      nombre_completo: 'Juan',
      id_sede: '1',
    } as any;
    component.asistentes = [ben as any];
    component.agregarAsistente(ben);
    expect(component.asistentes.length).toBe(1);
  });

  // ---------------------------------------------------------------------
  it('🗑️ eliminarAsistente() debe eliminar si eliminar = S', () => {
    component.asistentes = [{ id_persona: '1', eliminar: 'S' } as any];
    component.eliminarAsistente('1');
    expect(component.asistentes.length).toBe(0);
  });

  // ---------------------------------------------------------------------
  it('🚫 eliminarAsistente() no debe eliminar si eliminar = N', () => {
    component.asistentes = [{ id_persona: '1', eliminar: 'N' } as any];
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    component.eliminarAsistente('1');
    expect(component.asistentes.length).toBe(1);
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  // ---------------------------------------------------------------------
  it('⚠️ guardarAsistencia() debe advertir si formulario inválido', async () => {
    component.asistenciaForm.setValue({ id_sede: '', descripcion: '' });
    await component.guardarAsistencia();
    expect(snackbarMock.warning).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------
  it('💾 guardarAsistencia() debe guardar correctamente y emitir cerrar', async () => {
    const mockSesion: Sesiones = { id_sesion: '1', id_actividad: '2' } as any;
    fixture.componentRef.setInput('evento', mockSesion);

    component.asistenciaForm.setValue({ id_sede: '1', descripcion: 'ok' });
    component.asistentes = [
      { id_persona: '1', eliminar: 'S' },
      { id_persona: '2', eliminar: 'N' },
    ] as any;

    const resp = { exitoso: 'S', mensaje: 'Guardado' };
    asistenciaServiceMock.guardarAsistencia.mockResolvedValueOnce(resp);

    const emitCerrar = jest.spyOn(component.cerrar, 'emit');

    await component.guardarAsistencia();

    expect(asistenciaServiceMock.guardarAsistencia).toHaveBeenCalled();
    expect(snackbarMock.success).toHaveBeenCalledWith('Guardado');
    expect(emitCerrar).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------
  it('💥 guardarAsistencia() debe mostrar warning si resp.exitoso ≠ S', async () => {
    const mockSesion: Sesiones = { id_sesion: '1', id_actividad: '2' } as any;
    fixture.componentRef.setInput('evento', mockSesion);
    component.asistenciaForm.setValue({ id_sede: '1', descripcion: 'ok' });
    const resp = { exitoso: 'N', mensaje: 'Falla' };
    asistenciaServiceMock.guardarAsistencia.mockResolvedValueOnce(resp);
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await component.guardarAsistencia();

    expect(snackbarMock.warning).toHaveBeenCalledWith('Falla');
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  // ---------------------------------------------------------------------
  it('🔥 guardarAsistencia() debe manejar error HTTP', async () => {
    const mockSesion: Sesiones = { id_sesion: '1', id_actividad: '2' } as any;
    fixture.componentRef.setInput('evento', mockSesion);
    component.asistenciaForm.setValue({ id_sede: '1', descripcion: 'ok' });
    asistenciaServiceMock.guardarAsistencia.mockRejectedValueOnce(
      new Error('HTTP'),
    );
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await component.guardarAsistencia();

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
