import { Component, input, output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsistenciaService } from '../../asistencia-lista/services/asistencia.service';
import { PreAsistencia } from '../../../shared/interfaces/pre-asistencia.interface';
import { GraphQLResponse } from '../../../shared/interfaces/graphql-response.interface';
import { SnackbarService } from '../../../shared/services/snackbar.service';

// 🔹 Definimos tipos explícitos
interface EventoSeleccionado {
  id_actividad: string;
  id_sesion: string;
  nombreSesion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

interface Sede {
  id_sede: string;
  nombre: string;
}

@Component({
  selector: 'app-asistencia-fotografica',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './asistencia-fotografica.component.html',
  styleUrls: ['./asistencia-fotografica.component.css']
})
export class AsistenciaFotograficaComponent implements OnInit {
  // 🔹 Datos que vienen del calendario al abrir el modal
  evento = input<EventoSeleccionado | null>(null);
  cerrar = output<void>();
  asistenciaGuardada = output<{
    id_actividad: string;
    id_sesion: string;
    imagen: string;
    numero_asistentes: number;
    descripcion: string;
    nuevos: never[];
  }>();

  bloqueado = false;

  asistenciaForm: FormGroup;
  imagenPrevia: string | null = null;
  imagenBase64: string | null = null; // ✅ para almacenar la foto en Base64
  sedes: Sede[] = []; // ✅ lista de sedes que viene del back/mock

  // ✅ usamos inject() en lugar de constructor
  private fb = inject(FormBuilder);
  private asistenciaService = inject(AsistenciaService);
  private snack = inject(SnackbarService);

  constructor() {
    this.asistenciaForm = this.fb.group({
      numeroAsistentes: ['', [Validators.required, Validators.min(1)]],
      descripcion: ['', Validators.required],
      foto: [null]
    });
  }

  ngOnInit(): void {
    const ev = this.evento();
    if (!ev) return;

    this.asistenciaService
  .obtenerDetalleAsistencia(ev.id_sesion)
  .then((data: PreAsistencia) => {
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
  })
  .catch((err) => {
    console.error('❌ Error al cargar detalle asistencia fotográfica:', err);
    // Opcional: this.snackBar.open('Error al cargar asistencia', 'Cerrar', { duration: 3000 });
  });
  }

  // ✅ tipamos el evento correctamente
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.asistenciaForm.patchValue({ foto: file });
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenBase64 = reader.result as string;
        this.imagenPrevia = this.imagenBase64;
      };
      reader.readAsDataURL(file);
    }
  }

  async guardar():Promise<GraphQLResponse  | void> {
    if (this.asistenciaForm.invalid) {
      this.asistenciaForm.markAllAsTouched();
      this.snack.warning('⚠️ Debes completar todos los campos obligatorios');
      return;
    }

    const ev = this.evento();
    if (!ev) return;

    const payload = {
      id_actividad: ev.id_actividad,
      id_sesion: ev.id_sesion,
      imagen: this.imagenBase64 || '',
      numero_asistentes: this.asistenciaForm.value.numeroAsistentes,
      descripcion: this.asistenciaForm.value.descripcion,
      nuevos: [] as never[]
    };

    console.log('📤 Enviando asistencia fotográfica (payload JSON):', payload);

    try {
      const resp = await this.asistenciaService.guardarAsistenciaFotografica(payload);

      console.log('✅ Respuesta del back (fotográfica):', resp);

      if (resp.exitoso === 'S') {
        this.asistenciaGuardada.emit(payload); // avisamos al padre que se guardó
        this.cerrar.emit();
      } else {
        console.error('❌ Error al guardar asistencia fotográfica:', resp.mensaje);
      }
    } catch (err) {
      console.error('❌ Error HTTP al guardar asistencia fotográfica:', err);
    }
  }
}
