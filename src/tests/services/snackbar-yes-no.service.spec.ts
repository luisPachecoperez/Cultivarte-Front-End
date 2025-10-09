// src/app/shared/services/snackbar-yes-no.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SnackbarYesNoService } from '../../app/shared/services/snackbar-yes-no.service';
import { ConfirmSnackbarComponent } from '../../app/shared/components/confirm-snackbar/confirm-snackbar.component';


// Mock de MatSnackBar
class MockMatSnackBar {
  openFromComponent = jasmine.createSpy('openFromComponent');
}

describe('SnackbarYesNoService', () => {
  let service: SnackbarYesNoService;
  let matSnackBar: MockMatSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SnackbarYesNoService,
        { provide: MatSnackBar, useClass: MockMatSnackBar },
      ],
    });

    service = TestBed.inject(SnackbarYesNoService);
    matSnackBar = TestBed.inject(MatSnackBar) as unknown as MockMatSnackBar;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Simula la resolución de la confirmación desde fuera (como lo haría el componente)
  const simulateUserResponse = (result: boolean) => {
    (service as any).confirmResult$.next(result);
  };

  // Prueba genérica reutilizable
  const testSnackbarMethod = (
    methodName: 'success' | 'warning' | 'error' | 'confirm',
    expectedPanelClass: string[],
    expectedPosition: 'right' | 'center' = 'right'
  ) => {
    it(`should open ${methodName} snackbar and return observable`, (done) => {
      const message = 'Test message';
      const duration = methodName === 'confirm' ? undefined : 3000;

      const obs$ = methodName === 'confirm'
        ? service.confirm(message)
        : service[methodName](message, duration);

      // Dado que usas importación dinámica, NO podemos esperar que openFromComponent
      // se llame inmediatamente. Pero SÍ podemos verificar que se llama
      // una vez que la promesa se resuelve.
      // Sin embargo, para evitar complejidad, asumimos que el componente se abre
      // y probamos SOLO el flujo del observable y la lógica de resolución.

      // Simulamos que el usuario responde después de un tick
      setTimeout(() => {
        simulateUserResponse(true);
      }, 0);

      obs$.subscribe((result: boolean) => {
        expect(result).toBeTrue();

        // Verificamos que openFromComponent fue llamado (al menos una vez)
        expect(matSnackBar.openFromComponent).toHaveBeenCalled();
        const callArgs = matSnackBar.openFromComponent.calls.mostRecent().args;
        expect(callArgs[0]).toBe(ConfirmSnackbarComponent);
        const config = callArgs[1];
        expect(config.data.message).toBe(message);
        expect(config.panelClass).toEqual(expectedPanelClass);
        expect(config.horizontalPosition).toBe(expectedPosition);
        expect(config.verticalPosition).toBe('top');
        if (methodName !== 'confirm') {
          expect(config.duration).toBe(duration);
        }
        done();
      });
    });
  };

  describe('success', () => {
    testSnackbarMethod('success', ['success-snackbar'], 'right');
  });

  describe('warning', () => {
    testSnackbarMethod('warning', ['warning-snackbar'], 'right');
  });

  describe('error', () => {
    testSnackbarMethod('error', ['error-snackbar'], 'right');
  });

  describe('confirm', () => {
    testSnackbarMethod('confirm', ['warning-snackbar'], 'center');
  });

  describe('observable behavior', () => {
    it('should complete after first emission (take(1))', (done) => {
      const obs$ = service.confirm('Test');

      let emissionCount = 0;
      obs$.subscribe(() => {
        emissionCount++;
      });

      simulateUserResponse(true);
      simulateUserResponse(false); // segunda emisión no debe contar

      setTimeout(() => {
        expect(emissionCount).toBe(1);
        done();
      }, 20);
    });
  });
});
