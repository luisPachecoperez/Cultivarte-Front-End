import { Component, input, output, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventModalService } from '../services/event-modal.services';
import { Tooltip } from 'bootstrap';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackbarService } from '../../../../shared/services/snackbar.service'; // ajusta la ruta
import { EventoModal } from '../interfaces/event-modal.interface';

@Component({
  selector: 'app-event-modal',
  templateUrl: './event-modal.component.html',
  styleUrls: ['./event-modal.component.css'],
  standalone: true,
  imports: [CommonModule, MatSnackBarModule]
})
export class EventModalComponent implements AfterViewInit {
  evento = input<EventoModal | null>(null);
  accionSeleccionada = output<'editar' | 'asistencia'>();
  cerrar = output<void>();

  mensajeResultado: string | null = null;
  exitoAccion = false;

  // ✅ inject() en lugar de constructor
  private eventModalService = inject(EventModalService);
  private snack = inject(SnackbarService);

  ngAfterViewInit(): void {
    const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(el => new Tooltip(el));
  }

  seleccionarAccion(tipo: 'editar' | 'asistencia') {
    this.accionSeleccionada.emit(tipo);
    this.cerrar.emit();
  }

  eliminarEvento() {
    const e = this.evento();
    if (!e) return;

    this.snack
      .confirm(`¿Deseas eliminar el evento "${e?.nombreSesion ?? 'sin nombre'}"?`)
      .subscribe((ok) => {
        if (!ok) return;

        this.eventModalService.eliminarEvento(e.id_actividad).subscribe({
          next: (res) => {
            const success = res.exitoso === 'S';

            if (success) {
              this.snack.success(res.mensaje ?? 'Eliminado correctamente');
              this.cerrar.emit();
            } else {
              this.snack.error(res.mensaje ?? 'No se pudo eliminar');
            }
          },
          error: (err) => {
            this.snack.error(err?.mensaje ?? 'Error eliminando el evento');
          }
        });
      });
  }

}
