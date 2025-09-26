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
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { inject } from '@angular/core';
import { PreAsistencia } from '../../../shared/interfaces/pre-asistencia.interface';
import { GraphQLResponse } from '../../../shared/interfaces/graphql-response.interface';
interface EventoSeleccionado {
  id_actividad: string;
  id_sesion: string;
  nombreSesion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

interface Beneficiario {
  id_persona: string;
  nombre_completo: string;
  id_sede: string;
  identificacion: string;
}

interface Asistente {
  id_persona: string;
  nombre_completo: string;
  id_sede: string | null;
  eliminar: 'S' | 'N';
}

interface Sede {
  id_sede: string;
  nombre: string;
}

interface DetalleAsistenciaResponse {
  beneficiarios: Beneficiario[];
  asistentes_sesiones: { id_persona: string; eliminar?: 'S' | 'N' }[];
  sedes: Sede[];
  id_sede?: string;
}

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './asistencia.component.html',
  styleUrls: ['./asistencia.component.css'],
})
export class AsistenciaComponent implements OnInit {
  evento = input<EventoSeleccionado | null>(null);
  cerrar = output<void>();

  beneficiariosBD: Beneficiario[] = [];
  asistentes: Asistente[] = [];
  filtro = new FormControl('');

  sedes: Sede[] = []; // ✅ ahora las sedes vienen del servicio
  asistenciaForm: FormGroup;

  private asistenciaService = inject(AsistenciaService);
  private fb = inject(FormBuilder);
  private snack = inject(SnackbarService);

  constructor() {
    this.asistenciaForm = this.fb.group({
      id_sede: ['', Validators.required],
      descripcion: [''],
    });
  }

  ngOnInit(): void {
    const ev = this.evento();
    if (!ev) return;
    this.asistenciaService
      .obtenerDetalleAsistencia(ev.id_sesion)
      .then((data: PreAsistencia) => {
        //console.log('📥 Llega desde Promise:', data);

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
          } as Asistente;
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
        b.identificacion?.toLowerCase().startsWith(texto);
      //console.log('coincideTexto:', coincideTexto, b.nombre_completo, texto, b.identificacion);
      return coincideSede && coincideTexto;
    });
  }

  agregarAsistente(beneficiario: Beneficiario) {
    if (
      !this.asistentes.find((a) => a.id_persona === beneficiario.id_persona)
    ) {
      //console.log('Agregar asistente:', beneficiario);

      // al guardarlo en asistentes debemos "convertirlo" a Asistente
      const nuevoAsistente: Asistente = {
        id_persona: beneficiario.id_persona,
        nombre_completo: beneficiario.nombre_completo,
        id_sede: beneficiario.id_sede,
        eliminar: 'S', // por defecto se puede eliminar
      };

      this.asistentes.push(nuevoAsistente);
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

  async guardarAsistencia() : Promise<GraphQLResponse | void> {
    if (this.asistenciaForm.invalid) {
      this.asistenciaForm.markAllAsTouched();
      this.snack.warning('⚠️ Debes completar todos los campos obligatorios');
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
        id_sesion: ev?.id_sesion ?? '',
        id_asistencia: uuidv4(),
      })),
    };

    //console.log('📤 Enviando asistencia normal:', payload);

    // 🔹 Aquí conectamos con el servicio
    try {
      const resp = await this.asistenciaService.guardarAsistencia(payload);

      //console.log('✅ Respuesta del back:', resp);

      if (resp.exitoso === 'S') {
        // éxito → cerramos modal
        this.cerrar.emit();
      } else {
        console.error('❌ Error al guardar asistencia:', resp.mensaje);
      }
    } catch (err) {
      console.error('❌ Error HTTP al guardar asistencia:', err);
    }
  }
}
