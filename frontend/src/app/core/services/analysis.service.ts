import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnalysisResponse } from '../models/analysis.model';

/**
 * Único punto de comunicación HTTP con el backend Code Insight AI.
 * Ningún componente debe usar HttpClient directamente — siempre a
 * través de este servicio, que a su vez lee la URL base de `environment`.
 */
@Injectable({ providedIn: 'root' })
export class AnalysisService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  analyzeGithubRepository(repositoryUrl: string): Observable<AnalysisResponse> {
    return this.http.post<AnalysisResponse>(`${this.baseUrl}/analysis`, {
      repositoryUrl,
    });
  }

  analyzeZipFile(file: File): Observable<AnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<AnalysisResponse>(
      `${this.baseUrl}/analysis/upload`,
      formData,
    );
  }
}
