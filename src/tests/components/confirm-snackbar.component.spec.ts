import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmSnackbarComponent } from '../../app/shared/components/confirm-snackbar/confirm-snackbar.component';
import {
  MatSnackBarModule,
  MatSnackBarRef,
  MAT_SNACK_BAR_DATA,
} from '@angular/material/snack-bar';

import { SnackbarService } from '../../app/shared/services/snackbar.service';

import { By } from '@angular/platform-browser';

// ✅ Mock del SnackbarService
class SnackbarServiceMock {
  resolveConfirm = jest.fn('resolveConfirm');
}

// ✅ Mock del MatSnackBarRef
class MatSnackBarRefMock {
  dismiss = jest.fn('dismiss');
}

describe('✅ ConfirmSnackbarComponent', () => {
  let component: ConfirmSnackbarComponent;
  let fixture: ComponentFixture<ConfirmSnackbarComponent>;
  let snackbarService: SnackbarServiceMock;
  let snackBarRef: MatSnackBarRefMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatSnackBarModule,
        ConfirmSnackbarComponent, // 👈 se importa, no se declara
      ],
      // ❌ quita 'declarations'
      providers: [
        { provide: SnackbarService, useClass: SnackbarServiceMock },
        { provide: MatSnackBarRef, useClass: MatSnackBarRefMock },
        { provide: MAT_SNACK_BAR_DATA, useValue: { message: '¿Estás seguro?' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmSnackbarComponent);
    component = fixture.componentInstance;
    snackbarService = TestBed.inject(SnackbarService) as unknown as SnackbarServiceMock;
    snackBarRef = TestBed.inject(MatSnackBarRef) as unknown as MatSnackBarRefMock;

    fixture.detectChanges();
  });


  it('✔️ debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('🧾 debe mostrar el mensaje recibido en data', () => {
    const messageEl = fixture.debugElement.query(By.css('span')).nativeElement;
    expect(messageEl.textContent).toContain('¿Estás seguro?');
  });

  it('✅ debe llamar a snackbarService.resolveConfirm(true) y cerrar el snackbar al hacer clic en "Sí"', () => {
    const yesButton = fixture.debugElement.queryAll(By.css('button'))[0].nativeElement;
    yesButton.click();

    expect(snackbarService.resolveConfirm).toHaveBeenCalledWith(true);
    expect(snackBarRef.dismiss).toHaveBeenCalled();
  });

  it('❌ debe llamar a snackbarService.resolveConfirm(false) y cerrar el snackbar al hacer clic en "No"', () => {
    const noButton = fixture.debugElement.queryAll(By.css('button'))[1].nativeElement;
    noButton.click();

    expect(snackbarService.resolveConfirm).toHaveBeenCalledWith(false);
    expect(snackBarRef.dismiss).toHaveBeenCalled();
  });
});
