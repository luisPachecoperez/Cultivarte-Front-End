import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';

type EstadoSesion = 'original' | 'nuevo' | 'modificado';

@Component({
  selector: 'app-grid-sesiones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './grid-sesiones.component.html'
})
export class GridSesionesComponent {
  /** 📥 FormArray del padre */
  formArray = input.required<FormArray>();

  /** 📥 id del evento (necesario para el mapeo DTO) */
  idEvento = input<string | null>(null);

  /** 🔒 solo lectura */
  soloLectura = input<boolean>(false);

  /** 📤 Emite snapshot de cambios acumulados al padre */
  cambios = output<{ nuevos: any[]; modificados: any[]; eliminados: any[] }>();

  /** (compat) */
  sesionModificada = output<void>();

  nuevaSesionForm: FormGroup;

  /** buffer de eliminados */
  private eliminadosBuffer: any[] = [];

  constructor(private fb: FormBuilder, private snack: SnackbarService) {
    this.nuevaSesionForm = this.fb.group({
      fecha: ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
    });
  }

  get sesiones(): FormGroup[] {
    this.asegurarMetadatos();
    return this.formArray().controls as FormGroup[];
  }

  private asegurarMetadatos(): void {
    (this.formArray().controls as FormGroup[]).forEach((fg) => {
      if (!fg.contains('metaEstado')) {
        fg.addControl('metaEstado', new FormControl<EstadoSesion>('original'));
      }
      if (!fg.contains('asistentes_sesion')) {
        fg.addControl('asistentes_sesion', new FormControl(0));
      }
      if (!fg.contains('id_sesion')) {
        fg.addControl('id_sesion', new FormControl(uuidv4()));
      }
      if (!fg.contains('id_actividad')) {
        fg.addControl('id_actividad', new FormControl(this.idEvento() ?? null));
      }
    });
  }

  agregarSesion(): void {
    if (this.nuevaSesionForm.invalid || this.soloLectura()) return;

    const nueva = this.fb.group({
      id_actividad: [this.idEvento()],
      id_sesion: [uuidv4()],
      fecha: [this.nuevaSesionForm.value.fecha, Validators.required],
      horaInicio: [this.nuevaSesionForm.value.horaInicio, Validators.required],
      horaFin: [this.nuevaSesionForm.value.horaFin, Validators.required],
      asistentes_sesion: [0],
      metaEstado: ['nuevo' as EstadoSesion]
    });

    this.formArray().push(nueva);
    this.nuevaSesionForm.reset();

    this.emitirCambios();
    this.sesionModificada.emit();
  }

  eliminarSesion(index: number): void {

    if (this.soloLectura()) return;
    console.log("El array; ", this.formArray());
    const fg = this.formArray().at(index) as FormGroup;
    const sesion = fg.getRawValue();
    console.log('sesion a eliminar:', sesion);
    console.log('asistentes sesión:', sesion.asistentes_sesion);

    if (sesion.asistentes_sesion && sesion.asistentes_sesion > 0) {
      this.snack.error(`No se puede eliminar: ${sesion.asistentes_sesion} asistentes`);
      return;
    }

    // 👉 Confirmación antes de eliminar
    const confirmacion = confirm('¿Seguro que quieres eliminar esta sesión?');
    if (!confirmacion) {
      this.snack.warning('Eliminación cancelada');
      return;
    }

    if (sesion.metaEstado !== 'nuevo') {
      // solo id_sesion en eliminados
      this.eliminadosBuffer.push({ id_sesion: sesion.id_sesion });
    }

    this.formArray().removeAt(index);
    this.emitirCambios();
    this.sesionModificada.emit();
    this.snack.success('Sesión eliminada correctamente');
  }

  notificarCambio(): void {
    if (this.soloLectura()) return;

    // 🔎 Validación y marcado por sesión (no global)
    this.sesiones.forEach((fg, idx) => {
      const asistentes = Number(fg.get('asistentes_sesion')?.value) || 0;

      if (asistentes > 0) {
        // Esta sesión tiene asistentes: no permitir modificarla
        if (fg.dirty) {
          console.warn(`❌ La sesión ${idx + 1} tiene asistentes; se ignoran cambios en esa fila`);
          // Opcional: dejar la fila como no-editada para que no se envíe como "modificada"
          fg.markAsPristine({ onlySelf: true });
        }
        return; // no marcar esta fila como 'modificado'
      }

      // Sesión editable: si cambió, marcar su estado
      const estado = fg.get('metaEstado')?.value as EstadoSesion;
      if (estado !== 'nuevo' && fg.dirty) {
        fg.get('metaEstado')?.setValue('modificado', { emitEvent: false });
      }
    });

    // 📤 Recalcular snapshot y notificar al padre
    this.emitirCambios();
    this.sesionModificada.emit();
  }

  /** 👉 snapshot para el padre (lo llamará al hacer "Actualizar") */
  getCambios() {
    const todos = (this.formArray().controls as FormGroup[]).map(fg => fg.getRawValue());
    const nuevos = todos.filter(s => s.metaEstado === 'nuevo').map(s => this.mapSesionDTO(s, true));
    const modificados = todos.filter(s => s.metaEstado === 'modificado').map(s => this.mapSesionDTO(s, false));
    const eliminados = [...this.eliminadosBuffer];
    console.log('nuevos:', nuevos);
    console.log('modificados:', modificados);
    console.log('eliminados:', eliminados);
    return { nuevos, modificados, eliminados };
  }

  /** emite el snapshot cada vez que hay cambios para que el padre lo tenga “listo” */
  private emitirCambios(): void {
    this.cambios.emit(this.getCambios());
  }

  /** normaliza nombres al formato del back */
  private mapSesionDTO(s: any, esNueva: boolean) {
    const dto: any = {
      // para NUEVOS y MODIFICADOS debe ir id_actividad
      id_actividad: s.id_actividad ?? this.idEvento(),
      fecha_sesion: s.fecha,
      hora_inicio: s.horaInicio,
      hora_fin: s.horaFin
    };
    if (!esNueva) {
      dto.id_sesion = s.id_sesion;
    }
    return dto;
  }

  /** opcional: llamar desde el padre tras guardar en el back */
  resetCambios() {
    this.eliminadosBuffer = [];
    // resetea banderas modificado a original
    (this.formArray().controls as FormGroup[]).forEach(fg => {
      if (fg.get('metaEstado')?.value !== 'nuevo') {
        fg.get('metaEstado')?.setValue('original', { emitEvent: false });
        fg.markAsPristine();
      }
    });
    this.emitirCambios();
  }
}
