import { Component, signal, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DataSyncService } from './indexdb/services/data-sync';
import { LoadIndexDB } from './indexdb/services/load-index-db.service';
import { AuthService } from './shared/services/auth.service';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  constructor(
    private dataSyncService: DataSyncService,
    private loadIndexDB: LoadIndexDB,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    // 🚀 Arranca la sincronización en background

   await this.dataSyncService.startSync();
   await this.loadIndexDB.cargarDatosIniciales(this.authService.getUserUuid() || '');

  }
}
