// src/app/app.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { AppComponent } from '../../app/app.component';
import { DataSyncService } from '../../app/indexdb/services/data-sync.service';
import { AuthService } from '../../app/shared/services/auth.service';
import { LoadingService } from '../../app/shared/services/loading.service';
import { LoadIndexDBService } from '../../app/indexdb/services/load-index-db.service';


// ---- Mocks con Jest ----
class MockDataSyncService {
  startSync = jest.fn().mockResolvedValue(undefined);
}

class MockAuthService {
  getUserUuid = jest.fn().mockReturnValue('mock-uuid');
}

class MockLoadIndexDBService {
  cargarDatosIniciales = jest.fn();
}

class MockLoadingService {
  show = jest.fn();
  hide = jest.fn();
}

// ---- Tests ----
describe('AppComponent (Jest)', () => {
  let component: AppComponent;
  let dataSyncService: MockDataSyncService;
  let authService: MockAuthService;
  let loadIndexDBService: MockLoadIndexDBService;
  let loadingService: MockLoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppComponent,
        { provide: DataSyncService, useClass: MockDataSyncService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: LoadIndexDBService, useClass: MockLoadIndexDBService },
        { provide: LoadingService, useClass: MockLoadingService },
      ],
    });

    component = TestBed.inject(AppComponent);
    dataSyncService = TestBed.inject(
      DataSyncService,
    ) as unknown as MockDataSyncService;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    loadIndexDBService = TestBed.inject(
      LoadIndexDBService,
    ) as unknown as MockLoadIndexDBService;
    loadingService = TestBed.inject(
      LoadingService,
    ) as unknown as MockLoadingService;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have title "CultiApp"', () => {
    expect(component.title).toBe('CultiApp');
  });

  describe('ngOnInit', () => {
    it('should show loading, sync data, load initial data, and hide loading on success', async () => {
      await component.ngOnInit();

      expect(loadingService.show).toHaveBeenCalled();
      expect(dataSyncService.startSync).toHaveBeenCalled();
      expect(authService.getUserUuid).toHaveBeenCalled();
      expect(loadIndexDBService.cargarDatosIniciales).toHaveBeenCalledWith(
        'mock-uuid',
      );
      expect(loadingService.hide).toHaveBeenCalled();
    });

    it('should hide loading even if an error occurs during sync', async () => {
      dataSyncService.startSync.mockRejectedValueOnce(new Error('Sync failed'));

      try {
        await component.ngOnInit();
        fail('Expected ngOnInit() to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toBe('Sync failed');
      }

      expect(loadingService.show).toHaveBeenCalled();
      expect(loadingService.hide).toHaveBeenCalled(); // finally block
    });
  });
});
