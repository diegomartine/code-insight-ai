import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { githubRepositoryUrlValidator } from "../../../shared/utils/github-url.validator";
import { formatFileSize } from "../../../shared/utils/file-size.util";

const MAX_ZIP_BYTES = 50 * 1024 * 1024; // debe reflejar el límite real del backend (ver AnalysisController)

type InputMode = "github" | "zip";

@Component({
  selector: "cia-repository-input",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./repository-input.component.html",
  styleUrl: "./repository-input.component.scss",
})
export class RepositoryInputComponent {
  /** El padre controla este estado según la llamada HTTP en curso. */
  @Input() loading = false;

  @Output() analyzeGithub = new EventEmitter<string>();
  @Output() analyzeZip = new EventEmitter<File>();

  readonly mode = signal<InputMode>("github");
  readonly selectedFile = signal<File | null>(null);
  readonly zipError = signal<string | null>(null);
  readonly isDragOver = signal(false);

  readonly githubUrlControl = new FormControl("", {
    nonNullable: true,
    validators: [Validators.required, githubRepositoryUrlValidator()],
  });

  formatFileSize = formatFileSize;

  setMode(mode: InputMode): void {
    if (this.loading) return;
    this.mode.set(mode);
  }

  submitGithub(): void {
    console.log("SUBMIT GITHUB:", this.githubUrlControl.value);

    if (this.loading) return;

    this.githubUrlControl.markAsTouched();

    if (this.githubUrlControl.invalid) {
      console.log("URL INVALIDA");
      return;
    }

    console.log("EMITIENDO:", this.githubUrlControl.value.trim());
    this.analyzeGithub.emit(this.githubUrlControl.value.trim());
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.setFile(file);
    input.value = ""; // permite volver a elegir el mismo archivo si se corrige el error
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    if (this.loading) return;
    const file = event.dataTransfer?.files?.[0] ?? null;
    this.setFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.loading) return;
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  clearFile(): void {
    this.selectedFile.set(null);
    this.zipError.set(null);
  }

  submitZip(): void {
    if (this.loading) return;
    const file = this.selectedFile();
    if (!file) {
      this.zipError.set("Selecciona un archivo ZIP para continuar.");
      return;
    }
    this.analyzeZip.emit(file);
  }

  private setFile(file: File | null): void {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".zip")) {
      this.zipError.set("El archivo debe tener extensión .zip");
      this.selectedFile.set(null);
      return;
    }

    if (file.size > MAX_ZIP_BYTES) {
      this.zipError.set(
        `El archivo excede el tamaño máximo permitido (${formatFileSize(MAX_ZIP_BYTES)}).`,
      );
      this.selectedFile.set(null);
      return;
    }

    this.zipError.set(null);
    this.selectedFile.set(file);
  }
}
