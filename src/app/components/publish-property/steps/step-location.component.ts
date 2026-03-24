import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyType } from '../../../models/property.model';

@Component({
  selector: 'app-step-location',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './step-location.component.html',
})
export class StepLocationComponent {
  @Input({ required: true }) form!: {
    title: string; type: PropertyType | '';
    city: string; district: string; address: string; description: string;
  };
  @Input() cities: string[] = [];
  @Input() propertyTypes: [PropertyType, string][] = [];
}
