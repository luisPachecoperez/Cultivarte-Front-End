import { Component, Inject } from '@angular/core';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-confirm-snackbar',
  template: `
    <div class="confirm-snackbar" style="display: flex;flex-direction:column; ">
      <span>{{ data.message }}</span>
      <div class="actions">
        <button class="button-mat" (click)="onClick(true)">Sí</button>
        <button class="button-mat"  (click)="onClick(false)">No</button>
      </div>
    </div>
  `,
  styles: [`

  `]
})
export class ConfirmSnackbarComponent {
  constructor(
    private snackBarRef: MatSnackBarRef<ConfirmSnackbarComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: any,
    private snackbarService: SnackbarService
  ) {}

  onClick(result: boolean) {
    this.snackbarService.resolveConfirm(result); // 👈 emite true/false
    this.snackBarRef.dismiss(); // 👈 cierra el snackbar (sin argumentos)
  }
}
