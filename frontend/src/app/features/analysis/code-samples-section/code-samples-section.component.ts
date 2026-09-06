import { Component, Input, signal } from '@angular/core';
import { CodeSample } from '../../../core/models/analysis.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

const PREVIEW_LINES = 8;
const MAX_SAMPLES_SHOWN = 12;

interface DisplaySample {
  path: string;
  extension: string;
  preview: string;
  full: string;
  isTruncated: boolean;
}

@Component({
  selector: 'cia-code-samples-section',
  standalone: true,
  imports: [EmptyStateComponent],
  templateUrl: './code-samples-section.component.html',
  styleUrl: './code-samples-section.component.scss',
})
export class CodeSamplesSectionComponent {
  displaySamples: DisplaySample[] = [];
  readonly expanded = signal<Set<string>>(new Set());

  @Input({ required: true })
  set codeSamples(value: CodeSample[]) {
    this.displaySamples = value.slice(0, MAX_SAMPLES_SHOWN).map((sample) => {
      const lines = sample.content.split('\n');
      const isTruncated = lines.length > PREVIEW_LINES;
      return {
        path: sample.path,
        extension: sample.path.split('.').pop() ?? 'txt',
        preview: lines.slice(0, PREVIEW_LINES).join('\n'),
        full: sample.content,
        isTruncated,
      };
    });
  }

  toggle(path: string): void {
    const next = new Set(this.expanded());
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    this.expanded.set(next);
  }

  isExpanded(path: string): boolean {
    return this.expanded().has(path);
  }
}
