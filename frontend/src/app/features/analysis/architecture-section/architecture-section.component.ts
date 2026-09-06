import { Component, Input } from '@angular/core';
import { ArchitectureInfo, ComponentsInfo } from '../../../core/models/analysis.model';

interface DiagramLayer {
  label: string;
  count: number;
}

@Component({
  selector: 'cia-architecture-section',
  standalone: true,
  templateUrl: './architecture-section.component.html',
  styleUrl: './architecture-section.component.scss',
})
export class ArchitectureSectionComponent {
  @Input({ required: true }) architecture!: ArchitectureInfo;

  private _components!: ComponentsInfo;
  diagramLayers: DiagramLayer[] = [];

  @Input({ required: true })
  set components(value: ComponentsInfo) {
    this._components = value;

    // El diagrama refleja ÚNICAMENTE componentes que el backend detectó con
    // evidencia real (ComponentAnalyzerService); nunca se agregan capas que
    // no fueron encontradas en el código.
    const candidates: DiagramLayer[] = [
      { label: 'Controller', count: value.controllers.length },
      { label: 'Service', count: value.services.length },
      { label: 'Repository', count: value.repositories.length },
      { label: 'Model / Data Source', count: value.models.length },
    ];

    this.diagramLayers = candidates.filter((layer) => layer.count > 0);
  }
  get components(): ComponentsInfo {
    return this._components;
  }

  get confidencePercent(): number {
    return Math.round((this.architecture.confidence ?? 0) * 100);
  }

  get confidenceTone(): 'success' | 'warning' | 'danger' {
    if (this.architecture.confidence >= 0.75) return 'success';
    if (this.architecture.confidence >= 0.45) return 'warning';
    return 'danger';
  }
}
