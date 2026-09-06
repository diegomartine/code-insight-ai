import {
  BadRequestException,
  ForbiddenException,
  GatewayTimeoutException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { RepositorySnapshot } from './types';

interface GithubTreeItem {
  path: string;
  type: 'blob' | 'tree';
}

@Injectable()
export class GithubRepositoryLoaderService {
  private readonly logger = new Logger(GithubRepositoryLoaderService.name);

  constructor(private readonly httpService: HttpService) {}

  async load(repositoryUrl: string): Promise<RepositorySnapshot> {
    const { owner, repo } = this.parseRepositoryUrl(repositoryUrl);

    const repository = await this.fetchRepositoryInfo(owner, repo);
    const tree = await this.fetchTree(owner, repo, repository.default_branch);

    const files = tree.filter((item) => item.type === 'blob');
    const directories = tree.filter((item) => item.type === 'tree');
    const filePaths = files.map((file) => file.path);

    const contentCache = new Map<string, string | null>();

    return {
      source: 'github',
      metadata: {
        name: repository.name,
        fullName: repository.full_name,
        description: repository.description,
        language: repository.language,
        stars: repository.stargazers_count,
        forks: repository.forks_count,
        defaultBranch: repository.default_branch,
        url: repository.html_url,
      },
      filePaths,
      totalFiles: files.length,
      totalDirectories: directories.length,
      getContent: (path: string) => this.getContent(owner, repo, path, contentCache),
    };
  }

  private parseRepositoryUrl(repositoryUrl: string): {
    owner: string;
    repo: string;
  } {
    const match = repositoryUrl.match(
      /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?\/?$/,
    );

    if (!match) {
      throw new BadRequestException(
        'Solo se admiten URLs públicas de repositorios de GitHub, con el formato https://github.com/usuario/repositorio',
      );
    }

    const [, owner, repo] = match;
    return { owner, repo };
  }

  private async fetchRepositoryInfo(owner: string, repo: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: this.getGithubHeaders(),
        }),
      );

      return response.data;
    } catch (error) {
      throw this.mapGithubError(error, owner, repo);
    }
  }

  private async fetchTree(
    owner: string,
    repo: string,
    defaultBranch: string,
  ): Promise<GithubTreeItem[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
          { headers: this.getGithubHeaders() },
        ),
      );

      const tree = response.data?.tree ?? [];

      if (tree.length === 0) {
        throw new BadRequestException(
          `El repositorio ${owner}/${repo} está vacío`,
        );
      }

      if (response.data?.truncated) {
        // El repositorio es demasiado grande y GitHub truncó el árbol
        // recursivo. No es un error fatal: se continúa el análisis con el
        // subconjunto de archivos recibido, mejor que fallar por completo.
        this.logger.warn(
          `El árbol de ${owner}/${repo} fue truncado por GitHub (repositorio muy grande); el análisis puede ser parcial.`,
        );
      }

      return tree;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw this.mapGithubError(error, owner, repo);
    }
  }

  private async getContent(
    owner: string,
    repo: string,
    path: string,
    cache: Map<string, string | null>,
  ): Promise<string | null> {
    if (cache.has(path)) {
      return cache.get(path) ?? null;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
          { headers: this.getGithubHeaders() },
        ),
      );

      const content = response.data?.content;
      if (!content) {
        cache.set(path, null);
        return null;
      }

      const decoded = Buffer.from(content, 'base64').toString('utf-8');
      cache.set(path, decoded);
      return decoded;
    } catch {
      // Un archivo puntual que no se pueda leer no debe tumbar todo el
      // análisis: se ignora y se continúa con el resto.
      cache.set(path, null);
      return null;
    }
  }

  private getGithubHeaders() {
    const token = process.env.GITHUB_TOKEN;

    return {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  private mapGithubError(
    error: unknown,
    owner: string,
    repo: string,
  ): HttpException {
    const axiosError = error as AxiosError;
    const status = axiosError?.response?.status;
    const rateLimitRemaining = (axiosError?.response?.headers as any)?.[
      'x-ratelimit-remaining'
    ];

    if (status === 404) {
      return new NotFoundException(
        `No se encontró el repositorio ${owner}/${repo}, o es privado y no es accesible con las credenciales configuradas`,
      );
    }

    if (status === 403 && rateLimitRemaining === '0') {
      return new HttpException(
        'Se alcanzó el límite de solicitudes de la API de GitHub (rate limit). Intenta nuevamente en unos minutos.',
        429,
      );
    }

    if (status === 403) {
      return new ForbiddenException(
        `Acceso denegado al repositorio ${owner}/${repo}. Puede ser privado o requerir permisos adicionales del token configurado`,
      );
    }

    if (status === 401) {
      return new UnauthorizedException(
        'El token de GitHub configurado no es válido o expiró',
      );
    }

    if (
      axiosError?.code === 'ECONNABORTED' ||
      axiosError?.code === 'ETIMEDOUT'
    ) {
      return new GatewayTimeoutException(
        'Tiempo de espera agotado al contactar la API de GitHub',
      );
    }

    return new BadRequestException(
      `No fue posible analizar el repositorio ${owner}/${repo} debido a un error al comunicarse con GitHub`,
    );
  }
}
