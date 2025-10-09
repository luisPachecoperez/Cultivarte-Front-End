import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Grid_sesionesComponent } from '../../app/eventos/components/grid-sesiones.component/pages/grid-sesiones.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormGroup, FormBuilder } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackbarService } from '../../app/shared/services/snackbar.service';
import { of } from 'rxjs';

// ✅ Mock del SnackbarService
class SnackbarServiceMock {
  error = jasmine.createSpy('error');
  warning = jasmine.createSpy('warning');
  success = jasmine.createSpy('success');
}

describe('✅ Grid_sesionesComponent (Angular 20)', () => {
  let component: Grid_sesionesComponent;
  let fixture: ComponentFixture<Grid_sesionesComponent>;
  let fb: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
      providers: [{ provide: SnackbarService, useClass: SnackbarServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Grid_sesionesComponent);
    component = fixture.componentInstance;
    fb = TestBed.inject(FormBuilder);

    // 🔹 Simulamos un FormArray padre
    const formArray = new FormArray<FormGroup>([]);
    (component as any).formArray = () => formArray;
    (component as any).idEvento = () => 'EVT123';
    (component as any).soloLectura = () => false;

    fixture.detectChanges();
  });

  it('✔️ debe crearse correctamente', () => {
    expect(component).toBeTruthy();
    expect(component.formArray).toBeDefined();
  });

  it('🧱 debe asegurar metadatos en los FormGroups', () => {
    const fg = fb.group({});
    component.formArray().push(fg);
    component['asegurarMetadatos']();

    expect(fg.contains('metaEstado')).toBeTrue();
    expect(fg.contains('nro_asistentes')).toBeTrue();
    expect(fg.contains('id_sesion')).toBeTrue();
    expect(fg.contains('id_actividad')).toBeTrue();
  });

  it('➕ debe agregar una sesión válida', () => {
    component.nuevaSesionForm.setValue({
      fecha_actividad: '2025-10-07',
      hora_inicio: '08:00',
      hora_fin: '10:00',
    });

    const emitSpy = spyOn(component.cambios, 'emit');
    const sesionSpy = spyOn(component.sesionModificada, 'emit');

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

    const snack = TestBed.inject(SnackbarService) as unknown as SnackbarServiceMock;
    component.eliminarSesion(0);

    expect(snack.error).toHaveBeenCalledWith('No se puede eliminar: 5 asistentes');
    expect(component.formArray().length).toBe(1);
  });

  it('🟡 eliminarSesion() debe eliminar sesión si el usuario confirma', () => {
    spyOn(window, 'confirm').and.returnValue(true);

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

    const emitSpy = spyOn(component.cambios, 'emit');
    component.eliminarSesion(0);

    expect(component.formArray().length).toBe(0);
    expect(emitSpy).toHaveBeenCalled();
  });

  it('🟢 eliminarSesion() debe mostrar advertencia si el usuario cancela', () => {
    spyOn(window, 'confirm').and.returnValue(false);

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

    const snack = TestBed.inject(SnackbarService) as unknown as SnackbarServiceMock;
    component.eliminarSesion(0);

    expect(snack.warning).toHaveBeenCalledWith('Eliminación cancelada');
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

    // ✅ simula cambio y marca como dirty
    fg.get('hora_inicio')?.setValue('09:00');
    fg.markAsDirty({ onlySelf: true });

    component.notificarCambio();

    expect(fg.get('metaEstado')?.value).toBe('modificado');
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
    component['eliminadosBuffer'] = [{ id_sesion: 'DEL1' }];

    const emitSpy = spyOn(component.cambios, 'emit');
    component.resetCambios();

    expect(component['eliminadosBuffer'].length).toBe(0);
    expect(fg.get('metaEstado')?.value).toBe('original');
    expect(emitSpy).toHaveBeenCalled();
  });
});
