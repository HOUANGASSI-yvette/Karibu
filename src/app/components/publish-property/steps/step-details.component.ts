import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './step-details.component.html',
})
export class StepDetailsComponent {
  @Input({ required: true }) form!: {
    surface: number; rooms: number; bedrooms: number; bathrooms: number; amenities: string[];
  };
  @Input() availableAmenities: string[] = [];
  @Output() toggleAmenity = new EventEmitter<string>();

  readonly counters: { key: 'rooms' | 'bedrooms' | 'bathrooms'; label: string; min: number; max: number }[] = [
    { key: 'rooms',     label: 'Pièces',   min: 1, max: 20 },
    { key: 'bedrooms',  label: 'Chambres', min: 0, max: 20 },
    { key: 'bathrooms', label: 'Sdb',      min: 1, max: 10 },
  ];

  decrement(key: 'rooms' | 'bedrooms' | 'bathrooms', min: number) {
    if (this.form[key] > min) this.form[key]--;
  }

  increment(key: 'rooms' | 'bedrooms' | 'bathrooms', max: number) {
    if (this.form[key] < max) this.form[key]++;
  }
}
