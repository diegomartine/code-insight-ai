import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GithubRepositoryLoaderService } from './github-repository-loader.service';
import { ZipRepositoryLoaderService } from './zip-repository-loader.service';

@Module({
  imports: [
    // Sin timeout, una API de GitHub lenta o caída dejaría la solicitud
    // colgada indefinidamente; con esto, GithubRepositoryLoaderService puede
    // traducir el error a un 504 (GatewayTimeoutException) de forma real.
    HttpModule.register({ timeout: 15000, maxRedirects: 3 }),
  ],
  providers: [GithubRepositoryLoaderService, ZipRepositoryLoaderService],
  exports: [GithubRepositoryLoaderService, ZipRepositoryLoaderService],
})
export class RepositoryModule {}
