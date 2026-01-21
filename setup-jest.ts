import 'jest-preset-angular/setup-env/zone';

// Polyfills mínimos requeridos
import 'zone.js';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

// ✅ Inicializa el entorno de pruebas Angular correctamente para standalone components
TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
// ✅ Mock global de crypto.randomUUID() tipado correctamente
import crypto from 'crypto';
import 'fake-indexeddb/auto';

if (typeof global.structuredClone !== 'function') {
  // @ts-ignore
  global.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

if (!global.crypto) {
  // @ts-ignore
  global.crypto = crypto;
}

if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = (): `${string}-${string}-${string}-${string}-${string}` => {
    // Genera un UUID v4 válido
    const bytes = crypto.randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
    const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` as const;
  };
}
