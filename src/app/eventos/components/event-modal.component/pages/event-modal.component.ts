import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventModalService } from '../services/event-modal.services';

@Component({
  selector: 'app-event-modal',
  templateUrl: './event-modal.component.html',
  styleUrls: ['./event-modal.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class EventModalComponent {
  // 🔹 Señales para inputs
  evento = input<any>(null);

  // 🔹 Outputs con nueva API
  accionSeleccionada = output<'editar' | 'asistencia'>();
  cerrar = output<void>();

  // 🔹 Estado local para feedback
  mensajeResultado: string | null = null;
  exitoAccion = false;

  constructor(private eventModalService: EventModalService) {}

  seleccionarAccion(tipo: 'editar' | 'asistencia') {
    this.accionSeleccionada.emit(tipo);
    this.cerrar.emit(); // cerrar modal desde el padre
  }

  eliminarEvento() {
    const e = this.evento();
    if (!e) return;

    this.eventModalService.eliminarEvento(e.id_evento, e.asistentes_evento).subscribe({
      next: (res) => {
        this.exitoAccion = res.exitoso === 'S';
        this.mensajeResultado = res.mensaje;

        if (this.exitoAccion) {
          setTimeout(() => this.cerrar.emit(), 1500); // cerrar modal tras éxito
        }
      },
      error: (err) => {
        this.exitoAccion = false;
        this.mensajeResultado = err.mensaje ?? 'Error eliminando el evento';
      }
    });
  }
}
