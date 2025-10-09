// src/app/shared/services/snackbar.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { SnackbarService } from '../../app/shared/services/snackbar.service';
import { ConfirmSnackbarComponent } from '../../app/shared/components/confirm-snackbar/confirm-snackbar.component';
import { Subject } from 'rxjs';
class MockMatSnackBar {
  open = jasmine.createSpy('open');
  openFromComponent = jasmine.createSpy('openFromComponent');
}

describe('SnackbarService', () => {
  let service: SnackbarService;
  let matSnackBar: MockMatSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SnackbarService,
        { provide: MatSnackBar, useClass: MockMatSnackBar },
      ],
    });

    service = TestBed.inject(SnackbarService);
    matSnackBar = TestBed.inject(MatSnackBar) as unknown as MockMatSnackBar;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- Pruebas para success, warning, error ---
  ['success', 'warning', 'error'].forEach(method => {
    it(`should open ${method} snackbar`, () => {
      (service as any)[method]('Test message');
      expect(matSnackBar.open).toHaveBeenCalledWith(
        'Test message',
        'Cerrar',
        jasmine.any(Object)
      );
    });
  });

  // --- Prueba para confirm (sin mock de import) ---
  it('should expose confirm result via resolveConfirm', (done) => {
    // Espiamos el método protegido si lo refactorizaste
    if ((service as any).loadConfirmComponent) {
      spyOn(service as any, 'loadConfirmComponent').and.returnValue(
        Promise.resolve({ ConfirmSnackbarComponent })
      );
    }

    const confirm$ = service.confirm('Test?');

    // Simulamos que el componente llama a resolveConfirm
    setTimeout(() => {
      service.resolveConfirm(true);
    }, 10);

    confirm$.subscribe((result: boolean) => {
      expect(result).toBeTrue();
      if ((service as any).loadConfirmComponent) {
        expect(matSnackBar.openFromComponent).toHaveBeenCalledWith(
          ConfirmSnackbarComponent,
          jasmine.any(Object)
        );
      }
      done();
    });
  });
});
