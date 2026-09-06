import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Valida que el valor sea una URL https de un repositorio de GitHub con el
 * formato https://github.com/{owner}/{repo}. Coincide con el regex que el
 * backend usa para parsear la URL (ver GithubRepositoryLoaderService), para
 * que el usuario reciba el error ANTES de golpear la API.
 */
export function githubRepositoryUrlValidator(): ValidatorFn {
  const pattern = /^https:\/\/github\.com\/[^/\s]+\/[^/\s#?]+\/?$/i;

  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').trim();

    if (!value) {
      return null; // el validador `required` ya se encarga de esto
    }

    return pattern.test(value) ? null : { githubUrl: true };
  };
}
