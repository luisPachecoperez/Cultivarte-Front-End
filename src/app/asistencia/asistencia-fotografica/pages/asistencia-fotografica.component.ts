import { Component, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-asistencia-fotografica',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './asistencia-fotografica.component.html',
  styleUrls: ['./asistencia-fotografica.component.css']
})
export class AsistenciaFotograficaComponent implements OnInit {
  // 🔹 Datos que vienen del calendario al abrir el modal
  evento = input<any>(null);
  cerrar = output<void>();
  asistenciaGuardada = output<any>();

  asistenciaForm: FormGroup;
  imagenPrevia: string | null = null;

  constructor(private fb: FormBuilder) {
    this.asistenciaForm = this.fb.group({
      numeroAsistentes: ['', [Validators.required, Validators.min(1)]],
      descripcion: ['', Validators.required],
      foto: [null],
      id_sede: ['', Validators.required] // 👈 seleccionamos la sede
    });
  }

  ngOnInit(): void {
    const ev = this.evento();
    if (ev) {
      // ✅ Precargar imagen si viene del backend
      if (ev.imagen) {
        this.imagenPrevia = ev.imagen;
      }

      // ✅ Precargar número de asistentes
      if (ev.numero_asistentes && ev.numero_asistentes > 0) {
        this.asistenciaForm.patchValue({
          numeroAsistentes: ev.numero_asistentes
        });
      }

      // ✅ Precargar sede si existe
      if (ev.id_sede) {
        this.asistenciaForm.patchValue({ id_sede: ev.id_sede });
      }
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.asistenciaForm.patchValue({ foto: file });
      const reader = new FileReader();
      reader.onload = () => (this.imagenPrevia = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  guardar(): void {
    if (this.asistenciaForm.invalid) {
      this.asistenciaForm.markAllAsTouched();
      return;
    }

    const ev = this.evento();

    const formData = new FormData();
    formData.append('id_evento', ev?.id_evento || '');
    formData.append('id_sesion', ev?.id_sesion || '');
    formData.append('id_sede', this.asistenciaForm.value.id_sede);
    formData.append('numeroAsistentes', this.asistenciaForm.value.numeroAsistentes);
    formData.append('descripcion', this.asistenciaForm.value.descripcion);

    if (this.asistenciaForm.value.foto) {
      formData.append('foto', this.asistenciaForm.value.foto);
    }

    // 👀 Mostrar valores de FormData en consola
    console.log('📤 Enviando asistencia fotográfica:');
    formData.forEach((v, k) => console.log(`${k}:`, v));

    // Emitir hacia el padre
    this.asistenciaGuardada.emit(formData);
    this.cerrar.emit();
  }
}
