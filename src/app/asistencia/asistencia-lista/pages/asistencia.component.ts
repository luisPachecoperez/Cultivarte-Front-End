import { Component, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from '@angular/forms';
import { AsistenciaService } from '../services/asistencia.service';
import { v4 as uuidv4 } from 'uuid';
import { PreAsistencia } from '../../../shared/interfaces/preasistencia.model';

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './asistencia.component.html',
  styleUrls: ['./asistencia.component.css'],
})
export class AsistenciaComponent implements OnInit {
  evento = input<any>(null);
  cerrar = output<void>();

  beneficiariosBD: any[] = [];
  asistentes: any[] = [];
  filtro = new FormControl('');

  sedes: any[] = []; // ✅ ahora las sedes vienen del servicio
  asistenciaForm: FormGroup;

  constructor(
    private asistenciaService: AsistenciaService,
    private fb: FormBuilder
  ) {
    this.asistenciaForm = this.fb.group({
      id_sede: ['', Validators.required],
      descripcion: [''], // se deja por consistencia con fotográfica
    });
  }

  ngOnInit(): void {
    const ev = this.evento();
    if (!ev) return;

    // 🚀 Cargar detalle desde el servicio
    this.asistenciaService
      .obtenerDetalleAsistencia(ev.id_sesion)
      .then((data: PreAsistencia) => {
        console.log('📥 Llega desde Promise:', data);

        this.beneficiariosBD = data.beneficiarios || [];
        this.asistentes = (data.asistentes_sesiones || []).map((asis: any) => {
          const beneficiario = this.beneficiariosBD.find(
            (b) => b.id_persona === asis.id_persona
          );
          return {
            id_persona: asis.id_persona,
            nombre_completo: beneficiario?.nombre_completo || 'Desconocido',
            id_sede: beneficiario?.id_sede || null,
            eliminar: asis.eliminar || 'S',
          };
        });
        this.sedes = data.sedes || [];
        if (data.id_sede) {
          this.asistenciaForm.patchValue({ id_sede: data.id_sede });
        }
        if (this.asistentes) {
          this.asistenciaForm.patchValue({ asistentes: this.asistentes });
        }
      })
      .catch((err) => {
        console.error('❌ Error desde Promise:', err);
        // opcional: this.snackBar.open('Error al cargar asistencia', 'Cerrar', { duration: 3000 });
      });

    /*sin async
      this.asistentes = (data.asistentes_sesiones || []).map((asis: any) => {
        const beneficiario = this.beneficiariosBD.find(b => b.id_persona === asis.id_persona);
        return {
          id_persona: asis.id_persona,
          nombre_completo: beneficiario?.nombre_completo || 'Desconocido',
          id_sede: beneficiario?.id_sede || null,
          eliminar: asis.eliminar || 'S'
        };
      });
      console.log('asistentes precargados:', this.asistentes);
      // ✅ Sedes
      console.log('Sedes:', data.id_sede);
      this.sedes = data.sedes || [];

      // ✅ Precargar sede si existe
      if (data.id_sede) {
        this.asistenciaForm.patchValue({ id_sede: data.id_sede });
      }
      if (this.asistentes) {
        this.asistenciaForm.patchValue({ asistentes: this.asistentes });
      }
    });*/
  }

  get resultadosBusqueda() {
    const texto = this.filtro.value?.toLowerCase().trim() || '';
    const sedeSeleccionada = this.asistenciaForm.value.id_sede;

    // ⛔ No mostrar nada si el usuario no ha escrito nada
    if (!texto) return [];

    return this.beneficiariosBD.filter((b) => {
      // 🔹 Filtra por sede primero
      const coincideSede = !sedeSeleccionada || b.id_sede === sedeSeleccionada;

      // 🔹 Filtrar SOLO si empieza con el texto (nombre o ID)
      const coincideTexto =
        b.nombre_completo?.toLowerCase().startsWith(texto) ||
        b.id_persona?.toLowerCase().startsWith(texto);

      return coincideSede && coincideTexto;
    });
  }

  agregarAsistente(beneficiario: any) {
    if (
      !this.asistentes.find((a) => a.id_persona === beneficiario.id_persona)
    ) {
      this.asistentes.push({ ...beneficiario });
    }
  }

  eliminarAsistente(id_persona: string) {
    const asistente = this.asistentes.find((a) => a.id_persona === id_persona);
    if (asistente?.eliminar === 'N') {
      console.warn('❌ No se puede eliminar este asistente');
      return;
    }
    this.asistentes = this.asistentes.filter(
      (a) => a.id_persona !== id_persona
    );
  }

 async guardarAsistencia() {
    if (this.asistenciaForm.invalid) {
      this.asistenciaForm.markAllAsTouched();
      return;
    }

    const ev = this.evento();

    const payload = {
      id_actividad: '',
      id_sesion: '',
      imagen: '', // vacío en asistencia normal
      numero_asistentes: 0,
      descripcion: '', // vacío si no aplica
      nuevos: this.asistentes.map((a) => ({
        id_persona: a.id_persona,
        id_sesion: ev?.id_sesion,
        id_asistencia: uuidv4(),
      })),
    };

    console.log('📤 Enviando asistencia normal:', payload);

    try {
      const resp = await this.asistenciaService.guardarAsistencia(payload);

      console.log('✅ Respuesta del back:', resp);

      if (resp.exitoso === 'S') {
        // éxito → cerramos modal
        this.cerrar.emit();
      } else {
        console.error('❌ Error al guardar asistencia:', resp.mensaje);
      }
    } catch (err) {
      console.error('❌ Error HTTP al guardar asistencia:', err);
    }

    /*antes del async
    this.asistenciaService.guardarAsistencia(payload).subscribe({
      next: (resp) => {
        console.log('✅ Respuesta del back:', resp);
        if (resp.exitoso === 'S') {
          // éxito → cerramos modal
          this.cerrar.emit();
        } else {
          console.error('❌ Error al guardar asistencia:', resp.mensaje);
        }
      },
      error: (err) => {
        console.error('❌ Error HTTP al guardar asistencia:', err);
      },
    });
    */
  }
}
