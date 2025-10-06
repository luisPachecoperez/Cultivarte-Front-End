import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { ConfirmSnackbarComponent } from '../components/confirm-snackbar/confirm-snackbar.component';
import { Subject } from 'rxjs';
@Injectable({ providedIn: 'root' })



export class SnackbarService {
  private confirmResult$ = new Subject<boolean>();

  constructor(private snack: MatSnackBar) {}

  success(message: string, duration = 3000) {
    this.snack.open(message, 'Cerrar', {
      duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  warning(message: string, duration = 3000) {
    this.snack.open(message, 'Cerrar', {
      duration,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  error(message: string, duration = 300000) {
    this.snack.open(message, 'Cerrar', {
      duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  // ✅ corregido para romper el ciclo circular
  confirm(message: string): Observable<boolean> {
    // Importación dinámica — solo carga el componente cuando se usa
    import('../components/confirm-snackbar/confirm-snackbar.component').then(({ ConfirmSnackbarComponent }) => {
      this.snack.openFromComponent(ConfirmSnackbarComponent, {
        data: { message },
        panelClass: ['warning-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    });

    // devuelve el observable con el resultado de confirmación
    return this.confirmResult$.asObservable().pipe(take(1));
  }

  resolveConfirm(result: boolean) {
    this.confirmResult$.next(result);
  }
}
