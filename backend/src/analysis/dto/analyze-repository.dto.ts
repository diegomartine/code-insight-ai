import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class AnalyzeRepositoryDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
  })
  repositoryUrl: string;
}
