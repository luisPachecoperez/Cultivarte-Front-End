import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { Subject } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class SnackbarYesNoService {
  private confirmResult$ = new Subject<boolean>();

  constructor(private snack: MatSnackBar) {}

  success(message: string, duration = 3000) {

    import('../components/confirm-snackbar/confirm-snackbar.component').then(({ ConfirmSnackbarComponent }) => {
      this.snack.openFromComponent(ConfirmSnackbarComponent, {
        data: { message },
        duration,
        panelClass: ['success-snackbar'],
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
    });

    return this.confirmResult$.asObservable().pipe(take(1));


  }

  warning(message: string, duration = 3000) {
    import('../components/confirm-snackbar/confirm-snackbar.component').then(({ ConfirmSnackbarComponent }) => {
      this.snack.openFromComponent(ConfirmSnackbarComponent, {
        data: { message },
        duration,
        panelClass: ['warning-snackbar'],
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
    });

    return this.confirmResult$.asObservable().pipe(take(1));
  }

  error(message: string, duration = 3000) {
    import('../components/confirm-snackbar/confirm-snackbar.component').then(({ ConfirmSnackbarComponent }) => {
      this.snack.openFromComponent(ConfirmSnackbarComponent, {
        data: { message },
        duration,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
    });

    return this.confirmResult$.asObservable().pipe(take(1));
  }

  confirm(message: string): Observable<boolean> {
    // ✅ Importación dinámica (lazy load del componente solo cuando se use)
    import('../components/confirm-snackbar/confirm-snackbar.component').then(({ ConfirmSnackbarComponent }) => {
      this.snack.openFromComponent(ConfirmSnackbarComponent, {
        data: { message },
        panelClass: ['warning-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    });

    // El observable sigue funcionando igual
    return this.confirmResult$.asObservable().pipe(take(1));
  }
}
