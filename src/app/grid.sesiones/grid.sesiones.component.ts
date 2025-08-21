import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-grid-sesiones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './grid.sesiones.component.html'
})
export class GridSesionesComponent {
  /** 📥 FormArray del padre */
  formArray = input.required<FormArray>();

  /** 🔒 Indica si el grid está en modo solo lectura **/
  soloLectura = input<boolean>(false);

  /** 📤 Emite al padre cuando una sesión es modificada **/
  sesionModificada = output<void>();

  nuevaSesionForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.nuevaSesionForm = this.fb.group({
      fecha: ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
    });
  }

  get sesiones(): FormGroup[] {
    return this.formArray().controls as FormGroup[];
  }

  agregarSesion(): void {
    if (this.nuevaSesionForm.invalid || this.soloLectura()) return;

    const nueva = this.fb.group({
      id_evento: [null],
      id_sesion: [uuidv4()], // 👈 siempre tiene un id único
      fecha: [this.nuevaSesionForm.value.fecha, Validators.required],
      horaInicio: [this.nuevaSesionForm.value.horaInicio, Validators.required],
      horaFin: [this.nuevaSesionForm.value.horaFin, Validators.required],
      asistentes_sesion: [0] // 👈 siempre inicia en 0
    });

    this.formArray().push(nueva);
    this.nuevaSesionForm.reset();
    this.sesionModificada.emit();
  }

  eliminarSesion(index: number): void {
    if (this.soloLectura()) return;

    const sesion = this.formArray().at(index).value;

    // ⛔ Bloquear si tiene asistentes
    if (sesion.asistentes_sesion && sesion.asistentes_sesion > 0) {
      console.warn('❌ No se puede eliminar la sesión porque tiene asistentes');
      return;
    }

    if (index >= 0 && index < this.formArray().length) {
      this.formArray().removeAt(index);
      this.sesionModificada.emit();
    }
  }

  notificarCambio(): void {
    if (this.soloLectura()) return;

    // ⛔ Bloquear edición si la sesión tiene asistentes
    const invalida = this.sesiones.some(s => s.value.asistentes_sesion > 0);
    if (invalida) {
      console.warn('❌ No se puede modificar una sesión con asistentes');
      return;
    }

    this.sesionModificada.emit();
  }
}
