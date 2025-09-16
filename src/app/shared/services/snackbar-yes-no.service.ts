import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, race } from 'rxjs';
import {   take } from 'rxjs/operators';
import { ConfirmSnackbarComponent } from '../components/confirm-snackbar/confirm-snackbar.component';
import { Subject } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class SnackbarYesNoService {
  private confirmResult$ = new Subject<boolean>();

  constructor(private snack: MatSnackBar) {}

  success(message: string, duration = 3000) {
    this.snack.open(message, 'Cerrar', {
      duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  warning(message: string, duration = 15000) {
    this.snack.open(message, 'Cerrar', {
      duration,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  error(message: string, duration = 3000) {
    this.snack.open(message, 'Cerrar', {
      duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  confirm(message: string): Observable<boolean> {
    this.snack.openFromComponent(ConfirmSnackbarComponent, {
      data: { message },

      panelClass: ['warning-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
    //console.log("Presiono algo");
    return this.confirmResult$.asObservable().pipe(take(1));
  }

  resolveConfirm(result: boolean) {
    this.confirmResult$.next(result);

  }

}
