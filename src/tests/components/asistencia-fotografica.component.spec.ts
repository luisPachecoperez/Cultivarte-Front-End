import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsistenciaFotograficaComponent } from '../../app/asistencia/asistencia-fotografica/pages/asistencia-fotografica.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AsistenciaService } from '../../app/asistencia/asistencia-lista/services/asistencia.service';
import { SnackbarService } from '../../app/shared/services/snackbar.service';
import { Sesiones } from '../../app/eventos/interfaces/sesiones.interface';
import { PreAsistencia } from '../../app/asistencia/interfaces/pre-asistencia.interface';


import { NgZone } from '@angular/core';


describe('✅ AsistenciaFotograficaComponent (Cobertura 90%)', () => {
  let component: AsistenciaFotograficaComponent;
  let fixture: ComponentFixture<AsistenciaFotograficaComponent>;
  let asistenciaServiceMock: jasmine.SpyObj<AsistenciaService>;
  let snackbarMock: jasmine.SpyObj<SnackbarService>;

  beforeEach(async () => {
    asistenciaServiceMock = jasmine.createSpyObj('AsistenciaService', [
      'obtenerDetalleAsistencia',
      'guardarAsistenciaFotografica',
    ]);
    snackbarMock = jasmine.createSpyObj('SnackbarService', ['warning', 'error', 'success']);

    await TestBed.configureTestingModule({
      imports: [CommonModule, ReactiveFormsModule, AsistenciaFotograficaComponent],
      providers: [
        { provide: AsistenciaService, useValue: asistenciaServiceMock },
        { provide: SnackbarService, useValue: snackbarMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AsistenciaFotograficaComponent);
    component = fixture.componentInstance;
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
    asistenciaServiceMock.obtenerDetalleAsistencia.calls.reset();

    await component.ngOnInit();

    expect(asistenciaServiceMock.obtenerDetalleAsistencia).not.toHaveBeenCalled();
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
    asistenciaServiceMock.obtenerDetalleAsistencia.and.returnValue(Promise.resolve(mockData));

    await component.ngOnInit();

    expect(asistenciaServiceMock.obtenerDetalleAsistencia).toHaveBeenCalledWith('10');
    expect(component.imagenPrevia).toBe(mockData.imagen);
    expect(component.asistenciaForm.disabled).toBeTrue();
    expect(component.bloqueado).toBeTrue();
  });

  it('❌ ngOnInit() debe manejar error si obtenerDetalleAsistencia falla', async () => {
    const mockSesion: Sesiones = { id_sesion: 'X', id_actividad: 'Y' } as any;
    fixture.componentRef.setInput('evento', mockSesion);
    asistenciaServiceMock.obtenerDetalleAsistencia.and.returnValue(Promise.reject('Error de red'));
    spyOn(console, 'error');

    await component.ngOnInit();
    await fixture.whenStable();
    await new Promise(r => setTimeout(r)); // 🔹 Espera flush de microtareas

    expect(console.error).toHaveBeenCalled();
  });

  it('🖼️ onFileSelected() debe convertir archivo a Base64', async () => {
    const zone = TestBed.inject(NgZone);
    const file = new Blob(['abc'], { type: 'text/plain' });
    const event = { target: { files: [file] } } as any;

    // ✅ Mock robusto de FileReader compatible con `reader.result`
    class MockFileReader {
      public result: string | ArrayBuffer | null = null;
      public onload: ((e: any) => void) | null = null;
      readAsDataURL(_f: any) {
        this.result = 'data:text/plain;base64,abc123';
        // Ejecutamos dentro del zone de Angular
        zone.run(() => this.onload?.({ target: { result: this.result } }));
      }
    }

    spyOn(window as any, 'FileReader').and.returnValue(new MockFileReader());

    // Ejecutar
    component.onFileSelected(event);

    // Esperar sincronización con Angular
    await fixture.whenStable();

    // ✅ Verificar resultados
    expect(component.imagenBase64).toBe('data:text/plain;base64,abc123');
    expect(component.imagenPrevia).toBe('data:text/plain;base64,abc123');
  });



  it('⚠️ guardar() debe mostrar advertencia si el formulario es inválido', async () => {
    component.asistenciaForm.setValue({ numeroAsistentes: null, descripcion: '', foto: null });
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
    asistenciaServiceMock.guardarAsistenciaFotografica.and.returnValue(Promise.resolve(response));
    spyOn(component.asistenciaGuardada, 'emit');
    spyOn(component.cerrar, 'emit');

    await component.guardar();

    expect(asistenciaServiceMock.guardarAsistenciaFotografica).toHaveBeenCalled();
    expect(component.asistenciaGuardada.emit).toHaveBeenCalled();
    expect(component.cerrar.emit).toHaveBeenCalled();
  });

  it('💥 guardar() debe capturar error HTTP', async () => {
    const mockSesion: Sesiones = { id_sesion: '1', id_actividad: '2' } as any;
    fixture.componentRef.setInput('evento', mockSesion);
    component.asistenciaForm.setValue({
      numeroAsistentes: 10,
      descripcion: 'Falla intencional',
      foto: null,
    });

    asistenciaServiceMock.guardarAsistenciaFotografica.and.returnValue(
      Promise.reject(new Error('Falla HTTP'))
    );
    spyOn(console, 'error');

    await component.guardar();

    expect(console.error).toHaveBeenCalled();
  });
});
