import { Component, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsistenciaService } from '../../asistencia-lista/services/asistencia.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';


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
  bloqueado = false;

  asistenciaForm: FormGroup;
  imagenPrevia: string | null = null;
  imagenBase64: string | null = null; // ✅ para almacenar la foto en Base64
  sedes: any[] = []; // ✅ lista de sedes que viene del back/mock

  constructor(private fb: FormBuilder, private asistenciaService: AsistenciaService, private snack: SnackbarService) {
    this.asistenciaForm = this.fb.group({
      numeroAsistentes: ['', [Validators.required, Validators.min(1)]],
      descripcion: ['', Validators.required],
      foto: [null]
    });
  }

  ngOnInit(): void {
    const ev = this.evento();
    if (!ev) return;

    // 🚀 Llamamos al servicio para obtener detalle de asistencia
    this.asistenciaService.obtenerDetalleAsistencia(ev.id_sesion).subscribe((data) => {
      console.log('📥 Detalle asistencia fotográfica:', data);

      // ✅ Guardamos sedes del backend/mock
      this.sedes = data.sedes || [];

      // ✅ Precargar imagen si viene del backend
      if (data.imagen) {
        this.imagenPrevia = data.imagen;
        this.imagenBase64 = data.imagen; // si ya viene en base64 o URL
      }

      // ✅ Precargar descripción
      if (data.descripcion) {
        this.asistenciaForm.patchValue({
          descripcion: data.descripcion
        });
      }

      // ✅ Precargar número de asistentes
      if (data.numero_asistentes && data.numero_asistentes > 0) {
        this.asistenciaForm.patchValue({
          numeroAsistentes: data.numero_asistentes
        });
      }

      // 🔒 Si hay cualquier dato, bloqueamos el formulario completo
      if (data.numero_asistentes > 0 || data.descripcion || data.imagen) {
        this.bloqueado = true;
        this.asistenciaForm.disable();
      }

    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.asistenciaForm.patchValue({ foto: file });
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenBase64 = reader.result as string; // ✅ guardamos en base64
        this.imagenPrevia = this.imagenBase64;       // mostramos preview
      };
      reader.readAsDataURL(file);
    }
  }

  guardar(): void {
    if (this.asistenciaForm.invalid) {
      this.asistenciaForm.markAllAsTouched();
      this.snack.warning('⚠️ Debes completar todos los campos obligatorios');
      return;
    }

    const ev = this.evento();

    // ✅ Construimos payload en JSON (NO FormData)
    const payload = {
      id_actividad: ev?.id_actividad || '',
      id_sesion: ev?.id_sesion || '',
      imagen: this.imagenBase64 || '',
      numero_asistentes: this.asistenciaForm.value.numeroAsistentes,
      descripcion: this.asistenciaForm.value.descripcion,
      nuevos: [] // 👈 siempre enviamos arreglo vacío en asistencia fotográfica
    };

    console.log('📤 Enviando asistencia fotográfica (payload JSON):', payload);

    // 🔹 Aquí conectamos directamente al service
    this.asistenciaService.guardarAsistenciaFotografica(payload).subscribe({
      next: (resp) => {
        console.log('✅ Respuesta del back (fotográfica):', resp);
        if (resp.exitoso === 'S') {
          this.asistenciaGuardada.emit(payload); // avisamos al padre que se guardó
          this.cerrar.emit();
        } else {
          console.error('❌ Error al guardar asistencia fotográfica:', resp.mensaje);
          this.snack.error('❌ Error al guardar asistencia fotográfica');
        }
      },
      error: (err) => {
        console.error('❌ Error HTTP al guardar asistencia fotográfica:', err);
        this.snack.error('❌ Error al guardar asistencia fotográfica');
      }
    });
  }
}
