import { ChangeDetectionStrategy, Component, HostListener, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideAlertTriangle, lucideInfo, lucideX } from '@ng-icons/lucide';

export interface ConfirmDialogConfig {
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    /** 'alert' => فقط یک دکمه، جایگزین alert() */
    mode?: 'confirm' | 'alert';
    /** اگر ست شود، یک چک‌باکس زیر متن پیام نمایش داده می‌شود (مثلاً: Also delete for X) */
    checkboxLabel?: string;
    checkboxDefault?: boolean;
}

export interface ConfirmDialogResult {
    confirmed: boolean;
    checked: boolean;
}

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NgIconComponent
    ],
    providers: [
        provideIcons({
            lucideAlertTriangle,
            lucideInfo,
            lucideX
        })
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    @if (isOpen()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        (click)="onBackdropClick($event)">

        <!-- Dialog Box -->
        <div
          role="dialog"
          aria-modal="true"
          (click)="$event.stopPropagation()"
          class="w-[92vw] sm:max-w-sm bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden shadow-2xl rounded-2xl select-none animate-in zoom-in-95 duration-150">

          <!-- هدر مودال -->
          <div class="flex items-center justify-between px-3.5 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              (click)="onCancel()"
              class="size-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
              <ng-icon name="lucideX" class="text-base"></ng-icon>
            </button>

            <h3 class="text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
              {{ title() }}
            </h3>

            <div class="size-8"></div>
          </div>

          <!-- بدنه پیام تایید -->
          <div class="p-4 space-y-3">
            <div class="flex items-center gap-3">
              <div
                class="size-10 rounded-full flex items-center justify-center shrink-0"
                [class.bg-red-100]="variant() === 'destructive'"
                [class.dark:bg-red-950/60]="variant() === 'destructive'"
                [class.text-red-600]="variant() === 'destructive'"
                [class.dark:text-red-400]="variant() === 'destructive'"
                [class.bg-emerald-100]="variant() !== 'destructive'"
                [class.dark:bg-emerald-950/60]="variant() !== 'destructive'"
                [class.text-emerald-600]="variant() !== 'destructive'"
                [class.dark:text-emerald-400]="variant() !== 'destructive'">
                @if (mode() === 'alert') {
                  <ng-icon name="lucideInfo" class="text-lg"></ng-icon>
                } @else {
                  <ng-icon name="lucideAlertTriangle" class="text-lg"></ng-icon>
                }
              </div>
              <div>
                <p class="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {{ message() }}
                </p>
              </div>
            </div>

            @if (checkboxLabel()) {
              <label class="flex items-center gap-2.5 pt-1 pl-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  [ngModel]="checked()"
                  (ngModelChange)="checked.set($event)"
                  class="size-4 rounded border-zinc-300 dark:border-zinc-700 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600" />
                <span class="text-xs text-zinc-700 dark:text-zinc-300">
                  {{ checkboxLabel() }}
                </span>
              </label>
            }
          </div>

          <!-- دکمه‌های تایید یا لغو -->
          <div class="flex items-center justify-end gap-2 p-3 border-t border-zinc-200 dark:border-zinc-800">
            @if (mode() !== 'alert') {
              <button
                type="button"
                (click)="onCancel()"
                class="px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer">
                {{ cancelText() }}
              </button>
            }

            <button
              type="button"
              (click)="onConfirm()"
              class="px-4 py-1.5 rounded-xl text-xs font-medium text-white transition-all shadow-sm active:scale-95 cursor-pointer"
              [class.bg-red-600]="variant() === 'destructive'"
              [class.hover:bg-red-500]="variant() === 'destructive'"
              [class.bg-emerald-600]="variant() !== 'destructive'"
              [class.hover:bg-emerald-500]="variant() !== 'destructive'">
              {{ confirmText() }}
            </button>
          </div>

        </div>
      </div>
    }
  `
})
export class ConfirmDialogComponent {
    readonly result = output<ConfirmDialogResult>();

    readonly isOpen = signal(false);
    readonly title = signal('');
    readonly message = signal('');
    readonly confirmText = signal('Confirm');
    readonly cancelText = signal('Cancel');
    readonly variant = signal<'default' | 'destructive'>('default');
    readonly mode = signal<'confirm' | 'alert'>('confirm');
    readonly checkboxLabel = signal<string | null>(null);
    readonly checked = signal<boolean>(false);

    private pendingResolve: ((res: ConfirmDialogResult) => void) | null = null;
    private openedAt = 0;

    @HostListener('document:keydown.escape')
    onEscapeKey(): void {
        if (this.isOpen()) {
            this.onCancel();
        }
    }

    open(config: ConfirmDialogConfig): Promise<ConfirmDialogResult> {
        if (this.pendingResolve) {
            this.pendingResolve({ confirmed: false, checked: false });
            this.pendingResolve = null;
        }

        this.title.set(config.title);
        this.message.set(config.message ?? '');
        this.variant.set(config.variant ?? 'default');
        this.mode.set(config.mode ?? 'confirm');
        this.cancelText.set(config.cancelText ?? 'Cancel');
        this.confirmText.set(
            config.confirmText ?? (config.mode === 'alert' ? 'Got it' : 'Confirm')
        );
        this.checkboxLabel.set(config.checkboxLabel ?? null);
        this.checked.set(config.checkboxDefault ?? false);

        this.openedAt = Date.now();
        this.isOpen.set(true);

        return new Promise<ConfirmDialogResult>(resolve => {
            this.pendingResolve = resolve;
        });
    }

    onBackdropClick(_event: MouseEvent): void {
        // اگر کمتر از 250 میلی‌ثانیه از باز شدن دیالوگ گذشته باشد،
        // یعنی این کلیک دنباله‌ی همان mousedown روی آیتم ContextMenu است و نادیده گرفته می‌شود
        if (Date.now() - this.openedAt < 250) {
            return;
        }
        this.onCancel();
    }

    onConfirm(): void {
        this.isOpen.set(false);
        this.settle({ confirmed: true, checked: this.checked() });
    }

    onCancel(): void {
        this.isOpen.set(false);
        this.settle({ confirmed: false, checked: false });
    }

    private settle(res: ConfirmDialogResult): void {
        const resolve = this.pendingResolve;
        this.pendingResolve = null;
        if (resolve) {
            resolve(res);
            this.result.emit(res);
        }
    }
}
