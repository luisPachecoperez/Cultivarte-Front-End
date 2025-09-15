import { Component} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DataSyncService } from './indexdb/services/data-sync.service';
import { AuthService } from './shared/services/auth.service';
import { inject } from '@angular/core';
import { LoadIndexDBService } from './indexdb/services/load-index-db.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private dataSyncService = inject(DataSyncService);
  private loadIndexDBService = inject(LoadIndexDBService)
  private authService = inject(AuthService);
  async ngOnInit() {
    // 🚀 Arranca la sincronización en background

   await this.dataSyncService.startSync();
   await this.loadIndexDBService.cargarDatosIniciales(this.authService.getUserUuid());

  }
}
