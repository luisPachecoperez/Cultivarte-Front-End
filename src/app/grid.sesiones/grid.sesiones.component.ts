import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-grid-sesiones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './grid.sesiones.component.html'
})
export class GridSesionesComponent {
  @Input() formArray!: FormArray;

  nuevaSesionForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.nuevaSesionForm = this.fb.group({
      fecha: ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
    });
  }

  get sesiones(): FormGroup[] {
    return this.formArray.controls as FormGroup[];
  }

  agregarSesion(): void {
    if (this.nuevaSesionForm.invalid) return;

    const nueva = this.fb.group({
      fecha: [this.nuevaSesionForm.value.fecha, Validators.required],
      horaInicio: [this.nuevaSesionForm.value.horaInicio, Validators.required],
      horaFin: [this.nuevaSesionForm.value.horaFin, Validators.required],
    });

    this.formArray.push(nueva);
    this.nuevaSesionForm.reset();
  }

  eliminarSesion(index: number): void {
    if (index >= 0 && index < this.formArray.length) {
      this.formArray.removeAt(index);
    }
  }
}
