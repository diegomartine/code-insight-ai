import { Component, Input, signal } from '@angular/core';
import { ComponentsInfo } from '../../../core/models/analysis.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

interface ComponentGroup {
  key: string;
  label: string;
  paths: string[];
}

@Component({
  selector: 'cia-components-section',
  standalone: true,
  imports: [EmptyStateComponent],
  templateUrl: './components-section.component.html',
  styleUrl: './components-section.component.scss',
})
export class ComponentsSectionComponent {
  private _components!: ComponentsInfo;
  groups: ComponentGroup[] = [];

  @Input({ required: true })
  set components(value: ComponentsInfo) {
    this._components = value;
    this.groups = [
      { key: 'controllers', label: 'Controllers', paths: value.controllers },
      { key: 'services', label: 'Services', paths: value.services },
      { key: 'repositories', label: 'Repositories', paths: value.repositories },
      { key: 'models', label: 'Models', paths: value.models },
      { key: 'frontendComponents', label: 'Frontend Components', paths: value.frontendComponents },
      { key: 'modules', label: 'Modules', paths: value.modules },
      { key: 'routes', label: 'Routes', paths: value.routes },
    ];
  }
  get components(): ComponentsInfo {
    return this._components;
  }

  readonly expanded = signal<Set<string>>(new Set());

  toggle(key: string): void {
    const next = new Set(this.expanded());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.expanded.set(next);
  }

  isExpanded(key: string): boolean {
    return this.expanded().has(key);
  }

  get hasAny(): boolean {
    return this.groups.some((g) => g.paths.length > 0);
  }
}
