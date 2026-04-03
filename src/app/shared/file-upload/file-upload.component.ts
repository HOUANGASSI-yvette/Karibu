import { Component, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Paperclip, X, File, Image, Video, Music } from 'lucide-angular';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.css'
})
export class FileUploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  @Output() fileSelected = new EventEmitter<File>();
  @Output() cancelled = new EventEmitter<void>();

  readonly PaperclipIcon = Paperclip;
  readonly XIcon = X;
  readonly FileIcon = File;
  readonly ImageIcon = Image;
  readonly VideoIcon = Video;
  readonly MusicIcon = Music;

  selectedFile: File | null = null;
  isDragging = false;
  previewUrl: string | null = null;

  // Limites selon backend
  private readonly MAX_SIZES = {
    image: 10 * 1024 * 1024,    // 10 MB
    document: 20 * 1024 * 1024, // 20 MB
    video: 50 * 1024 * 1024,    // 50 MB
    audio: 10 * 1024 * 1024     // 10 MB
  };

  private readonly ALLOWED_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
               'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
               'text/plain'],
    video: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4']
  };

  onFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    
    if (event.dataTransfer?.files.length) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  private handleFile(file: File) {
    const fileType = this.getFileType(file.type);
    
    if (!fileType) {
      alert('Type de fichier non supporté');
      return;
    }

    const maxSize = this.MAX_SIZES[fileType];
    if (file.size > maxSize) {
      alert(`Fichier trop volumineux. Maximum : ${this.formatSize(maxSize)}`);
      return;
    }

    this.selectedFile = file;
    
    // Générer preview pour images
    if (fileType === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  private getFileType(mimeType: string): 'image' | 'document' | 'video' | 'audio' | null {
    for (const [type, mimes] of Object.entries(this.ALLOWED_TYPES)) {
      if (mimes.includes(mimeType)) {
        return type as any;
      }
    }
    return null;
  }

  openFilePicker() {
    this.fileInput.nativeElement.click();
  }

  removeFile() {
    this.selectedFile = null;
    this.previewUrl = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  confirm() {
    if (this.selectedFile) {
      this.fileSelected.emit(this.selectedFile);
      this.removeFile();
    }
  }

  cancel() {
    this.removeFile();
    this.cancelled.emit();
  }

  get fileIcon() {
    if (!this.selectedFile) return this.FileIcon;
    
    const type = this.getFileType(this.selectedFile.type);
    switch (type) {
      case 'image': return this.ImageIcon;
      case 'video': return this.VideoIcon;
      case 'audio': return this.MusicIcon;
      default: return this.FileIcon;
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  get fileSizeFormatted(): string {
    return this.selectedFile ? this.formatSize(this.selectedFile.size) : '';
  }
}
