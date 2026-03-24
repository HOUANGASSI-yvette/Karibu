import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center">
      @for (step of steps; track step.num; let last = $last) {
        <div class="flex items-center" [class]="!last ? 'flex-1' : ''">
          <button
            type="button"
            (click)="step.num < currentStep && goToStep.emit(step.num)"
            [disabled]="step.num >= currentStep"
            class="flex items-center gap-2 shrink-0 disabled:cursor-default">
            <div [class]="currentStep === step.num
              ? 'w-8 h-8 bg-amber-800 flex items-center justify-center text-white text-xs font-bold'
              : currentStep > step.num
                ? 'w-8 h-8 bg-amber-800 flex items-center justify-center text-white text-xs'
                : 'w-8 h-8 border border-stone-300 flex items-center justify-center text-stone-400 text-xs'">
              @if (currentStep > step.num) { ✓ } @else { {{ step.num }} }
            </div>
            <span [class]="currentStep >= step.num
              ? 'text-xs font-medium text-stone-700 hidden sm:block'
              : 'text-xs text-stone-400 hidden sm:block'">
              {{ step.label }}
            </span>
          </button>
          @if (!last) {
            <div class="flex-1 h-px mx-3"
                 [class]="currentStep > step.num ? 'bg-amber-800' : 'bg-stone-300'">
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class StepIndicatorComponent {
  @Input({ required: true }) steps!: { num: number; label: string }[];
  @Input({ required: true }) currentStep!: number;
  @Output() goToStep = new EventEmitter<number>();
}
