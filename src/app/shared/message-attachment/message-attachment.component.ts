import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, File, Download, Image, Video, Music, FileText, Eye, ExternalLink } from 'lucide-angular';
import { MessageAttachment } from '../../models/chat.models';

@Component({
  selector: 'app-message-attachment',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="mt-2">
      <!-- Image Preview -->
      @if (attachment.file_type === 'image') {
        <div class="max-w-xs relative group">
          <img 
            [src]="attachment.thumbnail || attachment.file" 
            [alt]="attachment.original_name"
            class="rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-sm border border-stone-200 max-h-48 w-auto"
            (click)="openFile()"
          />
          <!-- Overlay on hover -->
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div class="bg-white rounded-full p-2 shadow-lg">
              <lucide-icon [img]="EyeIcon" class="w-4 h-4 text-stone-600"></lucide-icon>
            </div>
          </div>
          <p class="text-xs text-stone-500 mt-2 truncate">{{ attachment.original_name }}</p>
          <p class="text-xs text-stone-400">{{ formatFileSize(attachment.file_size) }}</p>
        </div>
      }

      <!-- Video Preview -->
      @if (attachment.file_type === 'video') {
        <div class="max-w-sm">
          <div class="relative rounded-lg border border-stone-200 overflow-hidden">
            <video 
              [src]="attachment.file" 
              class="w-full h-auto max-h-48" 
              controls
              preload="metadata"
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>
          <div class="flex items-center justify-between mt-2">
            <div>
              <p class="text-sm font-medium text-stone-900 truncate">{{ attachment.original_name }}</p>
              <p class="text-xs text-stone-500">{{ formatFileSize(attachment.file_size) }}</p>
            </div>
            <button 
              (click)="downloadFile()"
              class="p-2 hover:bg-stone-100 rounded-full transition-colors"
              title="Télécharger"
            >
              <lucide-icon [img]="DownloadIcon" class="w-4 h-4 text-stone-500"></lucide-icon>
            </button>
          </div>
        </div>
      }

      <!-- Audio Player -->
      @if (attachment.file_type === 'audio') {
        <div class="max-w-sm">
          <div class="bg-stone-50 rounded-lg p-3 border border-stone-200">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <lucide-icon [img]="MusicIcon" class="w-5 h-5 text-green-600"></lucide-icon>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-stone-900 truncate">{{ attachment.original_name }}</p>
                <p class="text-xs text-stone-500">{{ formatFileSize(attachment.file_size) }}</p>
              </div>
            </div>
            <audio 
              [src]="attachment.file" 
              controls 
              class="w-full h-8"
              preload="metadata"
            >
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </div>
        </div>
      }

      <!-- Document / Other Files -->
      @if (attachment.file_type === 'document') {
        <div 
          class="flex items-center gap-3 p-3 border border-stone-200 rounded-lg bg-stone-50 max-w-sm cursor-pointer hover:bg-stone-100 hover:border-stone-300 transition-all duration-200 group"
          (click)="openFile()"
        >
          <!-- File Icon -->
          <div class="w-10 h-10 rounded-lg bg-white border border-stone-200 flex items-center justify-center flex-shrink-0 group-hover:border-amber-300 transition-colors">
            <lucide-icon 
              [img]="getDocumentIcon()" 
              class="w-5 h-5 transition-colors"
              [class.text-blue-600]="isPdf()"
              [class.text-red-600]="isWord()"
              [class.text-green-600]="isExcel()"
              [class.text-amber-600]="isOther()"
            ></lucide-icon>
          </div>

          <!-- File Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-stone-900 truncate">{{ attachment.original_name }}</p>
            <div class="flex items-center gap-2 mt-1">
              <p class="text-xs text-stone-500">{{ formatFileSize(attachment.file_size) }}</p>
              <span class="text-xs text-stone-400">•</span>
              <p class="text-xs text-stone-500 uppercase">{{ getFileExtension() }}</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1">
            <button 
              (click)="$event.stopPropagation(); downloadFile()"
              class="p-1.5 hover:bg-stone-200 rounded transition-colors"
              title="Télécharger"
            >
              <lucide-icon [img]="DownloadIcon" class="w-4 h-4 text-stone-500"></lucide-icon>
            </button>
            <lucide-icon [img]="ExternalLinkIcon" class="w-4 h-4 text-stone-400"></lucide-icon>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    audio {
      filter: sepia(20%) saturate(70%) hue-rotate(15deg) brightness(0.9);
    }
    video {
      background: #000;
    }
  `]
})
export class MessageAttachmentComponent {
  @Input() attachment!: MessageAttachment;

  readonly FileIcon = File;
  readonly DownloadIcon = Download;
  readonly ImageIcon = Image;
  readonly VideoIcon = Video;
  readonly MusicIcon = Music;
  readonly FileTextIcon = FileText;
  readonly EyeIcon = Eye;
  readonly ExternalLinkIcon = ExternalLink;

  getDocumentIcon() {
    if (this.isPdf()) return this.FileTextIcon;
    if (this.isWord() || this.isExcel()) return this.FileTextIcon;
    return this.FileIcon;
  }

  isPdf(): boolean {
    return this.attachment.original_name.toLowerCase().endsWith('.pdf');
  }

  isWord(): boolean {
    const name = this.attachment.original_name.toLowerCase();
    return name.endsWith('.doc') || name.endsWith('.docx');
  }

  isExcel(): boolean {
    const name = this.attachment.original_name.toLowerCase();
    return name.endsWith('.xls') || name.endsWith('.xlsx');
  }

  isOther(): boolean {
    return !this.isPdf() && !this.isWord() && !this.isExcel();
  }

  getFileExtension(): string {
    const parts = this.attachment.original_name.split('.');
    return parts.length > 1 ? parts.pop()! : 'fichier';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  openFile() {
    window.open(this.attachment.file, '_blank');
  }

  downloadFile() {
    const link = document.createElement('a');
    link.href = this.attachment.file;
    link.download = this.attachment.original_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
