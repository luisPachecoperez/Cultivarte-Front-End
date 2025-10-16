import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SesionFormValue } from '../../../interfaces/sesion-form-value.interface';
type EstadoSesion = 'original' | 'nuevo' | 'modificado';

export interface Eliminados {
  id_sesion: string;
}

@Component({
  selector: 'app-grid-sesiones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './grid-sesiones.component.html',
})
export class GridSesionesComponent {
  /** 📥 FormArray del padre */
  formArray = input.required<FormArray>();

  /** 📥 id del evento (necesario para el mapeo DTO) */
  idEvento = input<string | null>(null);

  /** 🔒 solo lectura */
  soloLectura = input<boolean>(false);

  /** 📤 Emite snapshot de cambios acumulados al padre */
  cambios = output<{
    nuevos: SesionFormValue[];
    modificados: SesionFormValue[];
    eliminados: { id_sesion: string }[];
  }>();

  /** (compat) */
  sesionModificada = output<void>();

  nuevaSesionForm: FormGroup;

  /** buffer de eliminados */
  private eliminadosBuffer: Eliminados[] = [];

  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(SnackbarService);

  constructor() {
    /* eslint-disable @typescript-eslint/unbound-method */
    this.nuevaSesionForm = this.fb.group({
      fecha_actividad: ['', Validators.required],
      hora_inicio: ['', Validators.required],
      hora_fin: ['', Validators.required],
    }) as FormGroup;
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
      if (!fg.contains('nro_asistentes')) {
        fg.addControl('nro_asistentes', new FormControl(0));
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

    const formValue: SesionFormValue = this.nuevaSesionForm
      .value as SesionFormValue;

    const nueva: FormGroup = this.fb.group({
      id_actividad: [this.idEvento()],
      id_sesion: [uuidv4()],
      fecha_actividad: [formValue.fecha_actividad, Validators.required],
      hora_inicio: [formValue.hora_inicio, Validators.required],
      hora_fin: [formValue.hora_fin, Validators.required],
      nro_asistentes: [0],
      metaEstado: ['nuevo' as EstadoSesion],
    });

    this.formArray().push(nueva);
    this.nuevaSesionForm.reset();

    this.emitirCambios();
    this.sesionModificada.emit();
  }

  eliminarSesion(index: number): void {
    if (this.soloLectura()) return;
    const fg = this.formArray().at(index) as FormGroup;
    const sesion: SesionFormValue = fg.getRawValue() as SesionFormValue;

    if (sesion.nro_asistentes && sesion.nro_asistentes > 0) {
      this.snack.error(
        `No se puede eliminar: ${sesion.nro_asistentes} asistentes`,
      );
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
      this.eliminadosBuffer.push({ id_sesion: sesion.id_sesion ?? '' });
    }

    this.formArray().removeAt(index);
    this.emitirCambios();
    this.sesionModificada.emit();
  }

  notificarCambio(): void {
    if (this.soloLectura()) return;

    // 🔎 Validación y marcado por sesión (no global)
    this.sesiones.forEach((fg, idx) => {
      const asistentes = Number(fg.get('nro_asistentes')?.value) || 0;

      if (asistentes > 0) {
        // Esta sesión tiene asistentes: no permitir modificarla
        if (fg.dirty) {
          console.warn(
            `❌ La sesión ${idx + 1} tiene asistentes; se ignoran cambios en esa fila`,
          );
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
    const todos: SesionFormValue[] = (
      this.formArray().controls as FormGroup[]
    ).map((fg: FormGroup) => fg.getRawValue() as SesionFormValue);

    const nuevos: SesionFormValue[] = todos
      .filter((s) => (s.metaEstado as string) === 'nuevo')
      .map((s) => this.mapSesionDTO(s, true));
    const modificados: SesionFormValue[] = todos
      .filter((s) => (s.metaEstado as string) === 'modificado')
      .map((s) => this.mapSesionDTO(s, false));
    const eliminados: Eliminados[] = [...this.eliminadosBuffer] as Eliminados[];

    return { nuevos, modificados, eliminados };
  }

  /** emite el snapshot cada vez que hay cambios para que el padre lo tenga “listo” */
  private emitirCambios(): void {
    this.cambios.emit(this.getCambios());
  }

  /** normaliza nombres al formato del back */
  private mapSesionDTO(s: SesionFormValue, esNueva: boolean): SesionFormValue {
    const dto: SesionFormValue = {
      // para NUEVOS y MODIFICADOS debe ir id_actividad
      id_actividad: s.id_actividad ?? this.idEvento(),
      id_sesion: s.id_sesion,
      fecha_actividad: s.fecha_actividad,
      hora_inicio: s.hora_inicio,
      hora_fin: s.hora_fin,
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
    (this.formArray().controls as FormGroup[]).forEach((fg) => {
      if (fg.get('metaEstado')?.value !== 'nuevo') {
        fg.get('metaEstado')?.setValue('original', { emitEvent: false });
        fg.markAsPristine();
      }
    });
    this.emitirCambios();
  }
}
