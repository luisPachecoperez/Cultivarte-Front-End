import { Component, input, output, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventModalService } from '../services/event-modal.service';
import { Tooltip } from 'bootstrap';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackbarService } from '../../../../shared/services/snackbar.service'; // ajusta la ruta}
import { firstValueFrom } from 'rxjs';
import { LoadingService } from '../../../../shared/services/loading.service';
import { Actividades } from '../../../interfaces/actividades.interface';
import { Sesiones } from '../../../interfaces/sesiones.interface';
@Component({
  selector: 'app-event-modal',
  templateUrl: './event-modal.component.html',
  styleUrls: ['./event-modal.component.css'],
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
})
export class EventModalComponent implements AfterViewInit {
  evento = input<Actividades | Sesiones | null | undefined>(undefined);
  accionSeleccionada = output<'editar' | 'asistencia'>();
  cerrar = output<void>();

  mensajeResultado: string | null = null;
  exitoAccion = false;

  private eventModalService = inject(EventModalService);
  private snack = inject(SnackbarService);
  private loadingService = inject(LoadingService);

  ngAfterViewInit(): void {
    const tooltipTriggerList = Array.from(
      document.querySelectorAll('[data-bs-toggle="tooltip"]'),
    );
    tooltipTriggerList.forEach((el) => new Tooltip(el));
  }

  seleccionarAccion(tipo: 'editar' | 'asistencia') {
    this.accionSeleccionada.emit(tipo);
    this.cerrar.emit();
  }

  async eliminarEvento() {
    const e = this.evento();
    if (!e) return;
    //console.log("Evento a eliminar:",this.evento());
    const ok = await firstValueFrom(
      this.snack.confirm(
        `¿Deseas eliminar el Evento "${e?.nombre_actividad ?? 'sin nombre'}"?`,
      ),
    );
    //console.log("Resultado ok:", ok);
    if (!ok) return;
    this.loadingService.show();
    try {
      const res = await this.eventModalService.eliminarEvento(e.id_actividad);
      //console.log("REspuesta de elminar evento:", res);
      const success = res.exitoso === 'S';
      if (success) {
        this.snack.success(res.mensaje ?? 'Eliminado correctamente');
        this.loadingService.hide();

        this.cerrar.emit();
      } else {
        this.snack.error(res.mensaje ?? 'No se pudo eliminar');
        this.loadingService.hide();
      }
    } catch (err: unknown) {
      this.snack.error(<string>err ?? 'Error eliminando el evento');
      this.loadingService.hide();
    }
  }
}
