import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tenant-messages',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-light text-stone-900 tracking-tight mb-4">Messages</h1>
      <div class="bg-white border border-stone-200 p-6">
        <p class="text-stone-500">Section en développement</p>
      </div>
    </div>
  `
})
export class TenantMessagesComponent {
}