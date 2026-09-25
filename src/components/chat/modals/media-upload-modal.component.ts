import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
    signal,
    computed,
    ElementRef,
    ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
    lucideX,
    lucidePlus,
    lucideClock,
    lucideCrop,
    lucideSmile,
    lucideFileText,
    lucideMusic,
    lucideVideo,
    lucideImage,
    lucideTrash2,
    lucideRotateCw,
    lucideCheck,
    lucideUndo2
} from '@ng-icons/lucide';

export interface UploadPayload {
    files: File[];
    caption: string;
    type: 'media' | 'document' | 'audio' | 'camera';
}

interface CropBox {
    x: number;      // Percentage 0..100
    y: number;      // Percentage 0..100
    width: number;  // Percentage 0..100
    height: number; // Percentage 0..100
}

@Component({
    selector: 'app-media-upload-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        HlmDialogImports,
        NgIconComponent
    ],
    providers: [
        provideIcons({
            lucideX,
            lucidePlus,
            lucideClock,
            lucideCrop,
            lucideSmile,
            lucideFileText,
            lucideMusic,
            lucideVideo,
            lucideImage,
            lucideTrash2,
            lucideRotateCw,
            lucideCheck,
            lucideUndo2
        })
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <hlm-dialog [state]="isOpen() ? 'open' : 'closed'" (closed)="onClose()">
      <hlm-dialog-content *hlmDialogPortal
        class="w-[94vw] sm:max-w-lg bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl rounded-2xl [&>button.absolute]:hidden">

        <!-- ================= CROP MODE VIEW ================= -->
        @if (isCropping()) {
          <!-- Crop Header Bar -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 select-none">
            <button type="button" (click)="cancelCrop()"
              class="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <ng-icon name="lucideX" class="text-lg block"></ng-icon>
            </button>

            <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Crop & Rotate</h3>

            <div class="flex items-center gap-1.5">
              <!-- Rotate Button -->
              <button type="button" (click)="rotateClockwise()"
                class="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" 
                title="Rotate 90°">
                <ng-icon name="lucideRotateCw" class="text-lg block"></ng-icon>
              </button>
              <!-- Reset Crop -->
              <button type="button" (click)="resetCropBox()"
                class="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" 
                title="Reset">
                <ng-icon name="lucideUndo2" class="text-lg block"></ng-icon>
              </button>
              <!-- Apply Crop -->
              <button type="button" (click)="applyCrop()"
                class="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-md shadow-emerald-600/20">
                <ng-icon name="lucideCheck" class="text-sm block"></ng-icon>
                <span>Done</span>
              </button>
            </div>
          </div>

          <!-- Interactive Crop Workspace -->
          <div class="p-4 bg-zinc-950 flex items-center justify-center min-h-[300px] max-h-[380px] overflow-hidden select-none touch-none relative">
            <div #cropContainer class="relative inline-block max-h-[280px] max-w-full">
              <!-- Rotated Source Image -->
              <img #cropImage
                   [src]="getPreviewUrl(selectedFiles()[selectedIndex()])" 
                   alt="Crop source"
                   [style.transform]="'rotate(' + rotation() + 'deg)'"
                   class="max-h-[280px] max-w-full object-contain rounded select-none pointer-events-none transition-transform duration-200" />

              <!-- Dimmed Mask and Crop Box Overlay -->
              <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <!-- Crop Rect with shadow cutout -->
                <div class="absolute border-2 border-emerald-400 pointer-events-auto cursor-move"
                     [style.left.%]="cropBox().x"
                     [style.top.%]="cropBox().y"
                     [style.width.%]="cropBox().width"
                     [style.height.%]="cropBox().height"
                     [style.box-shadow]="'0 0 0 9999px rgba(0, 0, 0, 0.65)'"
                     (pointerdown)="startDrag($event, 'move')">
                  
                  <!-- Rule of Thirds Grid -->
                  <div class="size-full grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                    <div class="border-r border-b border-white/50"></div>
                    <div class="border-r border-b border-white/50"></div>
                    <div class="border-b border-white/50"></div>
                    <div class="border-r border-b border-white/50"></div>
                    <div class="border-r border-b border-white/50"></div>
                    <div class="border-b border-white/50"></div>
                    <div class="border-r border-b border-white/50"></div>
                    <div class="border-r border-b border-white/50"></div>
                    <div></div>
                  </div>

                  <!-- Corner Handles -->
                  <div (pointerdown)="startDrag($event, 'nw')" class="absolute -top-1.5 -left-1.5 size-4 bg-emerald-400 rounded-xs cursor-nwse-resize"></div>
                  <div (pointerdown)="startDrag($event, 'ne')" class="absolute -top-1.5 -right-1.5 size-4 bg-emerald-400 rounded-xs cursor-nesw-resize"></div>
                  <div (pointerdown)="startDrag($event, 'sw')" class="absolute -bottom-1.5 -left-1.5 size-4 bg-emerald-400 rounded-xs cursor-nesw-resize"></div>
                  <div (pointerdown)="startDrag($event, 'se')" class="absolute -bottom-1.5 -right-1.5 size-4 bg-emerald-400 rounded-xs cursor-nwse-resize"></div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ================= NORMAL PREVIEW MODE ================= -->
        @else {
          <!-- Top Header Bar -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 select-none">
            <button type="button" (click)="onClose()"
              class="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer p-1 rounded-lg">
              <ng-icon name="lucideX" class="text-xl block"></ng-icon>
            </button>

            <h3 hlmDialogTitle class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {{ titleText() }}
            </h3>

            <div class="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
              <!-- Add more files -->
              <label class="p-1 rounded-lg hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer" title="Add file">
                <input type="file" multiple class="hidden" (change)="onAddMoreFiles($event)" [accept]="acceptedTypes()" />
                <ng-icon name="lucidePlus" class="text-lg block"></ng-icon>
              </label>
              <!-- Crop / Edit (Media only) -->
              @if ((activeFileType() === 'media' || activeFileType() === 'camera') && isImage(selectedFiles()[selectedIndex()])) {
                <button type="button" 
                  (click)="startCrop()"
                  class="p-1 rounded-lg hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer" 
                  title="Crop & Edit">
                  <ng-icon name="lucideCrop" class="text-lg block"></ng-icon>
                </button>
              }
            </div>
          </div>

          <!-- Main Preview Area -->
          <div class="p-4 flex flex-col items-center justify-center bg-zinc-100/60 dark:bg-zinc-950/60 min-h-[220px] max-h-[340px] overflow-hidden relative">
            
            <!-- 1. Image Preview -->
            @if (isImage(selectedFiles()[selectedIndex()])) {
              <img [src]="getPreviewUrl(selectedFiles()[selectedIndex()])" 
                   alt="Preview" 
                   class="max-h-[280px] max-w-full rounded-xl object-contain shadow-lg animate-in fade-in zoom-in-95 duration-150" />
            }

            <!-- 2. Video Preview -->
            @else if (isVideo(selectedFiles()[selectedIndex()])) {
              <video [src]="getPreviewUrl(selectedFiles()[selectedIndex()])" 
                     controls 
                     class="max-h-[280px] max-w-full rounded-xl shadow-lg animate-in fade-in duration-150">
              </video>
            }

            <!-- 3. Audio Preview -->
            @else if (isAudio(selectedFiles()[selectedIndex()])) {
              <div class="flex flex-col items-center gap-3 p-6 bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-xs">
                <div class="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ng-icon name="lucideMusic" class="text-3xl"></ng-icon>
                </div>
                <div class="text-center w-full truncate">
                  <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ selectedFiles()[selectedIndex()]?.name }}</p>
                  <p class="text-xs text-zinc-500 dark:text-zinc-400">{{ formatSize(selectedFiles()[selectedIndex()]?.size || 0) }}</p>
                </div>
                <audio [src]="getPreviewUrl(selectedFiles()[selectedIndex()])" controls class="w-full mt-2 h-10"></audio>
              </div>
            }

            <!-- 4. Document / Generic File Preview -->
            @else {
              <div class="flex items-center gap-4 p-5 bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-xs">
                <div class="size-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ng-icon name="lucideFileText" class="text-2xl"></ng-icon>
                </div>
                <div class="flex flex-col flex-1 min-w-0">
                  <p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{{ selectedFiles()[selectedIndex()]?.name }}</p>
                  <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{{ formatSize(selectedFiles()[selectedIndex()]?.size || 0) }}</p>
                </div>
              </div>
            }

            @if (selectedFiles().length > 1) {
              <div class="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2 px-4 py-1.5 overflow-x-auto">
                @for (file of selectedFiles(); track $index) {
                  <button type="button" (click)="selectedIndex.set($index)"
                    class="size-10 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer relative group"
                    [class.border-emerald-600]="selectedIndex() === $index"
                    [class.dark:border-emerald-500]="selectedIndex() === $index"
                    [class.border-zinc-300]="selectedIndex() !== $index"
                    [class.dark:border-zinc-700]="selectedIndex() !== $index">
                    @if (isImage(file)) {
                      <img [src]="getPreviewUrl(file)" class="size-full object-cover" />
                    } @else {
                      <div class="size-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 text-xs font-bold uppercase">
                        {{ file.name.split('.').pop() || 'file' }}
                      </div>
                    }
                    <span (click)="removeFile($index, $event)" class="absolute top-0 right-0 p-0.5 bg-black/70 hover:bg-red-600 text-white rounded-bl opacity-0 group-hover:opacity-100 transition-opacity">
                      <ng-icon name="lucideTrash2" class="text-[10px]"></ng-icon>
                    </span>
                  </button>
                }
              </div>
            }
          </div>

          <!-- Caption Input Box -->
          <div class="p-4 space-y-4">
            <div class="relative group">
              <span class="absolute -top-2.5 left-4 px-1.5 bg-white dark:bg-zinc-900 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 z-10 select-none">
                Caption
              </span>
              <div class="flex items-center gap-2 border border-zinc-200 dark:border-zinc-700 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl px-3.5 py-2.5 bg-zinc-50/50 dark:bg-zinc-800/40 transition-all">
                <button type="button" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                  <ng-icon name="lucideSmile" class="text-lg block"></ng-icon>
                </button>
                <input type="text" [(ngModel)]="caption" (keyup.enter)="onSend()"
                  placeholder="Add a caption..."
                  class="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none" />
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-3 pt-1">
              <button type="button" (click)="onClose()"
                class="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-sm transition-all duration-150 cursor-pointer text-center">
                Cancel
              </button>
              <button type="button" (click)="onSend()" [disabled]="selectedFiles().length === 0"
                class="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white font-medium text-sm transition-all duration-150 cursor-pointer shadow-md shadow-emerald-600/20 text-center">
                Send
              </button>
            </div>
          </div>
        }

      </hlm-dialog-content>
    </hlm-dialog>
  `
})
export class MediaUploadModalComponent {
    @ViewChild('cropContainer') cropContainerRef?: ElementRef<HTMLDivElement>;

    isOpen = signal<boolean>(false);
    activeFileType = signal<'media' | 'document' | 'audio' | 'camera'>('media');
    selectedFiles = signal<File[]>([]);
    selectedIndex = signal<number>(0);
    caption = '';

    // Crop State Signals
    isCropping = signal<boolean>(false);
    rotation = signal<number>(0);
    cropBox = signal<CropBox>({ x: 10, y: 10, width: 80, height: 80 });

    private previewCache = new Map<File, string>();

    @Output() fileSent = new EventEmitter<UploadPayload>();

    titleText = computed(() => {
        switch (this.activeFileType()) {
            case 'media':
            case 'camera':
                return 'Send Photo / Video';
            case 'audio':
                return 'Send Audio';
            case 'document':
            default:
                return 'Send File';
        }
    });

    acceptedTypes = computed(() => {
        switch (this.activeFileType()) {
            case 'media':
            case 'camera':
                return 'image/*,video/*';
            case 'audio':
                return 'audio/*';
            case 'document':
                return '*/*';
        }
    });

    open(files: FileList | File[], type: 'media' | 'document' | 'audio' | 'camera') {
        this.selectedFiles.set(Array.from(files));
        this.activeFileType.set(type);
        this.selectedIndex.set(0);
        this.caption = '';
        this.isCropping.set(false);
        this.isOpen.set(true);
    }

    onClose() {
        this.previewCache.forEach(url => URL.revokeObjectURL(url));
        this.previewCache.clear();
        this.isOpen.set(false);
        this.isCropping.set(false);
        this.selectedFiles.set([]);
    }

    onAddMoreFiles(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const current = this.selectedFiles();
            this.selectedFiles.set([...current, ...Array.from(input.files)]);
            input.value = '';
        }
    }

    removeFile(index: number, event: Event) {
        event.stopPropagation();
        const current = [...this.selectedFiles()];
        current.splice(index, 1);
        this.selectedFiles.set(current);
        if (this.selectedIndex() >= current.length) {
            this.selectedIndex.set(Math.max(0, current.length - 1));
        }
        if (current.length === 0) {
            this.onClose();
        }
    }

    getPreviewUrl(file?: File): string {
        if (!file) return '';
        if (!this.previewCache.has(file)) {
            this.previewCache.set(file, URL.createObjectURL(file));
        }
        return this.previewCache.get(file)!;
    }

    isImage(file?: File): boolean {
        return !!file?.type.startsWith('image/');
    }

    isVideo(file?: File): boolean {
        return !!file?.type.startsWith('video/');
    }

    isAudio(file?: File): boolean {
        return !!file?.type.startsWith('audio/');
    }

    formatSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
    }

    // ================= CROP LOGIC =================

    startCrop() {
        const currentFile = this.selectedFiles()[this.selectedIndex()];
        if (!this.isImage(currentFile)) return;
        this.rotation.set(0);
        this.resetCropBox();
        this.isCropping.set(true);
    }

    cancelCrop() {
        this.isCropping.set(false);
    }

    resetCropBox() {
        this.cropBox.set({ x: 5, y: 5, width: 90, height: 90 });
    }

    rotateClockwise() {
        this.rotation.update(r => (r + 90) % 360);
    }

    startDrag(event: PointerEvent, handle: 'move' | 'nw' | 'ne' | 'sw' | 'se') {
        event.preventDefault();
        event.stopPropagation();

        const container = this.cropContainerRef?.nativeElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const startX = event.clientX;
        const startY = event.clientY;
        const initialBox = { ...this.cropBox() };

        const onPointerMove = (e: PointerEvent) => {
            const deltaX = ((e.clientX - startX) / rect.width) * 100;
            const deltaY = ((e.clientY - startY) / rect.height) * 100;

            let newBox = { ...initialBox };

            if (handle === 'move') {
                newBox.x = Math.max(0, Math.min(100 - newBox.width, initialBox.x + deltaX));
                newBox.y = Math.max(0, Math.min(100 - newBox.height, initialBox.y + deltaY));
            } else if (handle === 'nw') {
                const newX = Math.min(initialBox.x + deltaX, initialBox.x + initialBox.width - 10);
                const newY = Math.min(initialBox.y + deltaY, initialBox.y + initialBox.height - 10);
                newBox.x = Math.max(0, newX);
                newBox.y = Math.max(0, newY);
                newBox.width = (initialBox.x + initialBox.width) - newBox.x;
                newBox.height = (initialBox.y + initialBox.height) - newBox.y;
            } else if (handle === 'ne') {
                const newY = Math.min(initialBox.y + deltaY, initialBox.y + initialBox.height - 10);
                newBox.y = Math.max(0, newY);
                newBox.width = Math.max(10, Math.min(100 - initialBox.x, initialBox.width + deltaX));
                newBox.height = (initialBox.y + initialBox.height) - newBox.y;
            } else if (handle === 'sw') {
                const newX = Math.min(initialBox.x + deltaX, initialBox.x + initialBox.width - 10);
                newBox.x = Math.max(0, newX);
                newBox.width = (initialBox.x + initialBox.width) - newBox.x;
                newBox.height = Math.max(10, Math.min(100 - initialBox.y, initialBox.height + deltaY));
            } else if (handle === 'se') {
                newBox.width = Math.max(10, Math.min(100 - initialBox.x, initialBox.width + deltaX));
                newBox.height = Math.max(10, Math.min(100 - initialBox.y, initialBox.height + deltaY));
            }

            this.cropBox.set(newBox);
        };

        const onPointerUp = () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    }

    applyCrop() {
        const activeFile = this.selectedFiles()[this.selectedIndex()];
        if (!activeFile) return;

        const img = new Image();
        img.src = this.getPreviewUrl(activeFile);
        img.onload = () => {
            const rot = (this.rotation() % 360 + 360) % 360;
            const isSwapped = rot === 90 || rot === 270;
            
            const srcW = img.naturalWidth;
            const srcH = img.naturalHeight;
            const visualW = isSwapped ? srcH : srcW;
            const visualH = isSwapped ? srcW : srcH;

            // 1. Draw full image rotated to temporary canvas
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = visualW;
            tempCanvas.height = visualH;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;

            tempCtx.translate(visualW / 2, visualH / 2);
            tempCtx.rotate((rot * Math.PI) / 180);
            tempCtx.drawImage(img, -srcW / 2, -srcH / 2);

            // 2. Extract cropped area to output canvas
            const box = this.cropBox();
            const cropX = (box.x / 100) * visualW;
            const cropY = (box.y / 100) * visualH;
            const cropW = (box.width / 100) * visualW;
            const cropH = (box.height / 100) * visualH;

            const outCanvas = document.createElement('canvas');
            outCanvas.width = Math.max(1, Math.round(cropW));
            outCanvas.height = Math.max(1, Math.round(cropH));
            const outCtx = outCanvas.getContext('2d');
            if (!outCtx) return;

            outCtx.drawImage(
                tempCanvas,
                cropX, cropY, cropW, cropH,
                0, 0, outCanvas.width, outCanvas.height
            );

            // 3. Convert to new File blob and replace in state
            outCanvas.toBlob((blob) => {
                if (!blob) return;
                const newCroppedFile = new File([blob], activeFile.name, {
                    type: activeFile.type || 'image/jpeg',
                    lastModified: Date.now()
                });

                // Invalidate old preview URL
                const oldUrl = this.previewCache.get(activeFile);
                if (oldUrl) URL.revokeObjectURL(oldUrl);
                this.previewCache.delete(activeFile);

                const files = [...this.selectedFiles()];
                files[this.selectedIndex()] = newCroppedFile;
                this.selectedFiles.set(files);

                this.isCropping.set(false);
            }, activeFile.type || 'image/jpeg', 0.92);
        };
    }

    onSend() {
        if (this.selectedFiles().length === 0) return;
        this.fileSent.emit({
            files: this.selectedFiles(),
            caption: this.caption.trim(),
            type: this.activeFileType()
        });
        this.onClose();
    }
}
