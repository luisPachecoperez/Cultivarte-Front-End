import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsistenciaFotograficaComponent } from '../../app/asistencia/asistencia-fotografica/pages/asistencia-fotografica.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AsistenciaService } from '../../app/asistencia/asistencia-lista/services/asistencia.service';
import { SnackbarService } from '../../app/shared/services/snackbar.service';
import { Sesiones } from '../../app/eventos/interfaces/sesiones.interface';
import { PreAsistencia } from '../../app/asistencia/interfaces/pre-asistencia.interface';
import { NgZone } from '@angular/core';

// ---- Mock Services con Jest ----
const asistenciaServiceMock = {
  obtenerDetalleAsistencia: jest.fn(),
  guardarAsistenciaFotografica: jest.fn(),
};

const snackbarMock = {
  warning: jest.fn(),
  error: jest.fn(),
  success: jest.fn(),
};

describe('✅ AsistenciaFotograficaComponent (Jest)', () => {
  let component: AsistenciaFotograficaComponent;
  let fixture: ComponentFixture<AsistenciaFotograficaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        AsistenciaFotograficaComponent,
      ],
      providers: [
        { provide: AsistenciaService, useValue: asistenciaServiceMock },
        { provide: SnackbarService, useValue: snackbarMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AsistenciaFotograficaComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('✅ debe crear el componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('✅ debe inicializar formulario vacío correctamente', () => {
    expect(component.asistenciaForm.get('numeroAsistentes')?.value).toBe('');
    expect(component.asistenciaForm.get('descripcion')?.value).toBe('');
    expect(component.asistenciaForm.get('foto')?.value).toBeNull();
  });

  it('⚙️ ngOnInit() no debe llamar servicio si evento es undefined', async () => {
    fixture.componentRef.setInput('evento', undefined);
    asistenciaServiceMock.obtenerDetalleAsistencia.mockReset();

    await component.ngOnInit();

    expect(
      asistenciaServiceMock.obtenerDetalleAsistencia,
    ).not.toHaveBeenCalled();
  });

  it('📥 ngOnInit() debe cargar datos de asistencia y bloquear formulario', async () => {
    const mockSesion: Sesiones = { id_sesion: '10', id_actividad: '20' } as any;
    const mockData: PreAsistencia = {
      id_sesion: '10',
      id_sede: '1',
      descripcion: 'Texto prueba',
      numero_asistentes: 3,
      imagen: 'data:image/png;base64,abc',
      sedes: [{ id_sede: '1', nombre: 'Sede Norte' }],
      foto: null,
      beneficiarios: [],
      asistentes_sesiones: [],
    };

    fixture.componentRef.setInput('evento', mockSesion);
    asistenciaServiceMock.obtenerDetalleAsistencia.mockResolvedValueOnce(
      mockData,
    );

    await component.ngOnInit();

    expect(asistenciaServiceMock.obtenerDetalleAsistencia).toHaveBeenCalledWith(
      '10',
    );
    expect(component.imagenPrevia).toBe(mockData.imagen);
    expect(component.asistenciaForm.disabled).toBe(true);
    expect(component.bloqueado).toBe(true);
  });

  it('❌ ngOnInit() debe manejar error si obtenerDetalleAsistencia falla', async () => {
    const mockSesion: Sesiones = { id_sesion: 'X', id_actividad: 'Y' } as any;
    fixture.componentRef.setInput('evento', mockSesion);
    asistenciaServiceMock.obtenerDetalleAsistencia.mockRejectedValueOnce(
      new Error('Error de red'),
    );
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await component.ngOnInit();
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r));

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('🖼️ onFileSelected() debe convertir archivo a Base64', async () => {
    const zone = TestBed.inject(NgZone);
    const file = new Blob(['abc'], { type: 'text/plain' });
    const event = { target: { files: [file] } } as any;

    class MockFileReader {
      public result: string | ArrayBuffer | null = null;
      public onload: ((e: any) => void) | null = null;
      readAsDataURL(_f: any) {
        this.result = 'data:text/plain;base64,abc123';
        zone.run(() => this.onload?.({ target: { result: this.result } }));
      }
    }

    jest
      .spyOn(window as any, 'FileReader')
      .mockImplementation(() => new MockFileReader() as any);

    component.onFileSelected(event);
    await fixture.whenStable();

    expect(component.imagenBase64).toBe('data:text/plain;base64,abc123');
    expect(component.imagenPrevia).toBe('data:text/plain;base64,abc123');
  });

  it('⚠️ guardar() debe mostrar advertencia si el formulario es inválido', async () => {
    component.asistenciaForm.setValue({
      numeroAsistentes: null,
      descripcion: '',
      foto: null,
    });
    await component.guardar();
    expect(snackbarMock.warning).toHaveBeenCalled();
  });

  it('💾 guardar() debe guardar correctamente y emitir eventos', async () => {
    const mockSesion: Sesiones = { id_sesion: '1', id_actividad: '2' } as any;
    fixture.componentRef.setInput('evento', mockSesion);

    component.asistenciaForm.setValue({
      numeroAsistentes: 5,
      descripcion: 'Asistencia OK',
      foto: null,
    });

    const response = { exitoso: 'S', mensaje: 'ok' };
    asistenciaServiceMock.guardarAsistenciaFotografica.mockResolvedValueOnce(
      response,
    );
    const emitAsistencia = jest.spyOn(component.asistenciaGuardada, 'emit');
    const emitCerrar = jest.spyOn(component.cerrar, 'emit');

    await component.guardar();

    expect(
      asistenciaServiceMock.guardarAsistenciaFotografica,
    ).toHaveBeenCalled();
    expect(emitAsistencia).toHaveBeenCalled();
    expect(emitCerrar).toHaveBeenCalled();
  });

  it('💥 guardar() debe capturar error HTTP', async () => {
    const mockSesion: Sesiones = { id_sesion: '1', id_actividad: '2' } as any;
    fixture.componentRef.setInput('evento', mockSesion);
    component.asistenciaForm.setValue({
      numeroAsistentes: 10,
      descripcion: 'Falla intencional',
      foto: null,
    });

    asistenciaServiceMock.guardarAsistenciaFotografica.mockRejectedValueOnce(
      new Error('Falla HTTP'),
    );
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await component.guardar();

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});