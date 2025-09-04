import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, race } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  constructor(private snack: MatSnackBar) {}

  success(message: string, duration = 4000) {
    this.snack.open(message, 'Cerrar', {
      duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  warning(message: string, duration = 5000) {
    this.snack.open(message, 'Cerrar', {
      duration,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  error(message: string, duration = 6000) {
    this.snack.open(message, 'Cerrar', {
      duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  /**
   * Confirmación con snackbar:
   * - Devuelve true si el usuario hace click en la acción (p.ej. "Sí, eliminar")
   * - Devuelve false si deja expirar o cierra el snackbar
   */
  confirm(message: string, actionLabel = 'Sí, eliminar', duration = 7000): Observable<boolean> {
    const ref = this.snack.open(message, actionLabel, {
      duration,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });

    const yes$ = ref.onAction().pipe(map(() => true), take(1));
    const no$  = ref.afterDismissed().pipe(
      filter(info => !info.dismissedByAction),
      map(() => false),
      take(1)
    );

    return race(yes$, no$).pipe(take(1));
  }
}
