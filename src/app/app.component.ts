import { Component, signal, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DataSyncService } from './indexdb/services/data-sync';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(private dataSyncService: DataSyncService) {}

  ngOnInit(): void {
    // 🚀 Arranca la sincronización en background
    this.dataSyncService.startSync();
  }
}
