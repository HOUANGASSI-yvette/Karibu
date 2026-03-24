import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoPreview } from '../../../models/property.model';

@Component({
  selector: 'app-step-photos',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './step-photos.component.html',
})
export class StepPhotosComponent {
  @Input({ required: true }) photos!: PhotoPreview[];
  @Input() photoError = '';
  @Input() MAX_PHOTOS = 8;
  @Input() MAX_SIZE_MB = 5;

  @Output() addFiles    = new EventEmitter<File[]>();
  @Output() removePhoto = new EventEmitter<number>();
  @Output() setCover    = new EventEmitter<number>();

  isDragOver = false;

  triggerFileInput() {
    document.getElementById('photo-input')?.click();
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.addFiles.emit(Array.from(input.files));
    input.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave() {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files?.length) {
      this.addFiles.emit(Array.from(event.dataTransfer.files));
    }
  }
}
