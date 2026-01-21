import { TestBed, ComponentFixture } from '@angular/core/testing';
import { GridSesionesComponent } from '../../app/eventos/components/grid-sesiones.component/pages/grid-sesiones.component';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormArray,
  FormGroup,
  FormBuilder,
} from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackbarService } from '../../app/shared/services/snackbar.service';

// ✅ Mock del SnackbarService
class SnackbarServiceMock {
  error = jest.fn();
  warning = jest.fn();
  success = jest.fn();
}

describe('✅ GridSesionesComponent (Angular 20 - Jest)', () => {
  let component: GridSesionesComponent;
  let fixture: ComponentFixture<GridSesionesComponent>;
  let fb: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        MatSnackBarModule,
        GridSesionesComponent,
      ],
      providers: [{ provide: SnackbarService, useClass: SnackbarServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(GridSesionesComponent);
    component = fixture.componentInstance;
    fb = TestBed.inject(FormBuilder);

    // 🔹 Simulamos un FormArray padre
    const formArray = new FormArray<FormGroup>([]);
    (component as any).formArray = () => formArray;
    (component as any).idEvento = () => 'EVT123';
    (component as any).soloLectura = () => false;

    fixture.detectChanges();
  });

  afterEach(() => jest.clearAllMocks());

  it('✔️ debe crearse correctamente', () => {
    expect(component).toBeTruthy();
    expect(component.formArray).toBeDefined();
  });

  it('🧱 debe asegurar metadatos en los FormGroups', () => {
    const fg = fb.group({});
    component.formArray().push(fg);
    (component as any).asegurarMetadatos();

    expect(fg.contains('metaEstado')).toBe(true);
    expect(fg.contains('nro_asistentes')).toBe(true);
    expect(fg.contains('id_sesion')).toBe(true);
    expect(fg.contains('id_actividad')).toBe(true);
  });

  it('🆕 debe asignar id_actividad=null si idEvento es null', () => {
    // Simula idEvento() devolviendo null
    (component as any).idEvento = () => null;
    const fg = fb.group({});
    component.formArray().push(fg);

    (component as any).asegurarMetadatos();

    expect(fg.get('id_actividad')?.value).toBeNull();
  });

  it('➕ debe agregar una sesión válida', () => {
    component.nuevaSesionForm.setValue({
      fecha_actividad: '2025-10-07',
      hora_inicio: '08:00',
      hora_fin: '10:00',
    });

    const emitSpy = jest.spyOn(component.cambios, 'emit');
    const sesionSpy = jest.spyOn(component.sesionModificada, 'emit');

    component.agregarSesion();

    expect(component.formArray().length).toBe(1);
    expect(emitSpy).toHaveBeenCalled();
    expect(sesionSpy).toHaveBeenCalled();
  });

  it('🚫 no debe agregar sesión si el formulario es inválido', () => {
    component.nuevaSesionForm.reset();
    const initialLength = component.formArray().length;

    component.agregarSesion();

    expect(component.formArray().length).toBe(initialLength);
  });

  it('❌ eliminarSesion() debe cancelar si hay asistentes', () => {
    const fg = fb.group({
      id_sesion: 'S1',
      id_actividad: 'EVT123',
      fecha_actividad: '2025-10-07',
      hora_inicio: '08:00',
      hora_fin: '10:00',
      nro_asistentes: 5,
      metaEstado: 'original',
    });
    component.formArray().push(fg);

    const snack = TestBed.inject(
      SnackbarService,
    ) as unknown as SnackbarServiceMock;
    component.eliminarSesion(0);

    expect(snack.error).toHaveBeenCalledWith(
      'No se puede eliminar: 5 asistentes',
    );
    expect(component.formArray().length).toBe(1);
  });

  it('🟡 eliminarSesion() debe eliminar sesión si el usuario confirma', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    const fg = fb.group({
      id_sesion: 'S2',
      id_actividad: 'EVT123',
      fecha_actividad: '2025-10-07',
      hora_inicio: '08:00',
      hora_fin: '10:00',
      nro_asistentes: 0,
      metaEstado: 'original',
    });
    component.formArray().push(fg);

    const emitSpy = jest.spyOn(component.cambios, 'emit');
    component.eliminarSesion(0);

    expect(component.formArray().length).toBe(0);
    expect(emitSpy).toHaveBeenCalled();
  });

  it('🗑️ debe pushear id_sesion vacío en eliminadosBuffer si id_sesion es undefined y metaEstado ≠ "nuevo"', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    // Sesión sin id_sesion y metaEstado original
    const fg = fb.group({
      // id_sesion: undefined,
      id_actividad: 'EVT123',
      fecha_actividad: '2025-10-07',
      hora_inicio: '08:00',
      hora_fin: '10:00',
      nro_asistentes: 0,
      metaEstado: 'original',
    });
    component.formArray().push(fg);

    (component as any).eliminadosBuffer = [];

    component.eliminarSesion(0);

    expect((component as any).eliminadosBuffer).toContainEqual({ id_sesion: '' });
  });

  it('🔒 eliminarSesion() no hace nada si soloLectura es true', () => {
    // Simula soloLectura() devolviendo true
    (component as any).soloLectura = () => true;

    // Agrega una sesión al FormArray
    const fg = fb.group({
      id_sesion: 'S1',
      id_actividad: 'EVT123',
      fecha_actividad: '2025-10-07',
      hora_inicio: '08:00',
      hora_fin: '10:00',
      nro_asistentes: 0,
      metaEstado: 'original',
    });
    component.formArray().push(fg);

    // Intenta eliminar la sesión
    component.eliminarSesion(0);

    // Verifica que la sesión no fue eliminada
    expect(component.formArray().length).toBe(1);
  });

  it('🟢 eliminarSesion() debe mostrar advertencia si el usuario cancela', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    const fg = fb.group({
      id_sesion: 'S3',
      id_actividad: 'EVT123',
      fecha_actividad: '2025-10-07',
      hora_inicio: '08:00',
      hora_fin: '10:00',
      nro_asistentes: 0,
      metaEstado: 'original',
    });
    component.formArray().push(fg);

    const snack = TestBed.inject(
      SnackbarService,
    ) as unknown as SnackbarServiceMock;
    component.eliminarSesion(0);

    expect(snack.warning).toHaveBeenCalledWith('Eliminación cancelada');
  });

  it('🆔 mapSesionDTO usa this.idEvento() si s.id_actividad es undefined', () => {
    // Simula idEvento() devolviendo un valor específico
    (component as any).idEvento = () => 'EVT-XYZ';

    // Sesión sin id_actividad
    const sesionSinIdActividad = {
      id_sesion: 'S1',
      // id_actividad: undefined,
      fecha_actividad: '2025-10-07',
      hora_inicio: '08:00',
      hora_fin: '10:00',
    };

    // Llama mapSesionDTO directamente
    const dto = (component as any).mapSesionDTO(sesionSinIdActividad, true);

    expect(dto.id_actividad).toBe('EVT-XYZ');
  });

  it('🔄 notificarCambio() debe marcar sesiones modificadas', () => {
    const fg = fb.group({
      id_sesion: 'S4',
      id_actividad: 'EVT123',
      fecha_actividad: '2025-10-07',
      hora_inicio: '08:00',
      hora_fin: '10:00',
      nro_asistentes: 0,
      metaEstado: 'original',
    });
    component.formArray().push(fg);

    fg.get('hora_inicio')?.setValue('09:00');
    fg.markAsDirty({ onlySelf: true });

    component.notificarCambio();

    expect(fg.get('metaEstado')?.value).toBe('modificado');
  });

  it('🔒 notificarCambio() no hace nada si soloLectura es true', () => {
    // Simula soloLectura() devolviendo true
    (component as any).soloLectura = () => true;

    // Espías para verificar que no se emiten eventos
    const emitSpy = jest.spyOn(component.cambios, 'emit');
    const sesionSpy = jest.spyOn(component.sesionModificada, 'emit');

    // Llama notificarCambio
    component.notificarCambio();

    // Verifica que no se emitieron eventos
    expect(emitSpy).not.toHaveBeenCalled();
    expect(sesionSpy).not.toHaveBeenCalled();
  });

  it('⚠️ notificarCambio() muestra warning si la sesión tiene asistentes y está dirty', () => {
    const fg = fb.group({
      id_sesion: 'S7',
      id_actividad: 'EVT123',
      fecha_actividad: '2025-10-07',
      hora_inicio: '08:00',
      hora_fin: '10:00',
      nro_asistentes: 3,
      metaEstado: 'original',
    });
    component.formArray().push(fg);

    fg.markAsDirty({ onlySelf: true });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

    component.notificarCambio();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('❌ La sesión 1 tiene asistentes; se ignoran cambios en esa fila')
    );
  });

  it('📤 getCambios() debe devolver snapshot correcto', () => {
    const fgNuevo = fb.group({
      id_sesion: 'S5',
      id_actividad: 'EVT123',
      fecha_actividad: '2025-10-07',
      hora_inicio: '08:00',
      hora_fin: '10:00',
      metaEstado: 'nuevo',
    });
    component.formArray().push(fgNuevo);

    const snapshot = component.getCambios();

    expect(snapshot.nuevos.length).toBe(1);
    expect(snapshot.modificados.length).toBe(0);
    expect(snapshot.eliminados.length).toBe(0);
  });

  it('🧼 resetCambios() debe limpiar el buffer y restaurar estados', () => {
    const fg = fb.group({
      id_sesion: 'S6',
      metaEstado: 'modificado',
    });
    component.formArray().push(fg);
    (component as any).eliminadosBuffer = [{ id_sesion: 'DEL1' }];

    const emitSpy = jest.spyOn(component.cambios, 'emit');
    component.resetCambios();

    expect((component as any).eliminadosBuffer.length).toBe(0);
    expect(fg.get('metaEstado')?.value).toBe('original');
    expect(emitSpy).toHaveBeenCalled();
  });
});
