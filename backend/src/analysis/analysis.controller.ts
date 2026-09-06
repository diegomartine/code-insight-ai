import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnalysisService } from './analysis.service';
import type { Express } from 'express';
import { AnalyzeRepositoryDto } from './dto/analyze-repository.dto';

const MAX_ZIP_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB comprimidos

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post()
  analyzeRepository(@Body() analyzeRepositoryDto: AnalyzeRepositoryDto) {
    return this.analysisService.analyzeFromGithub(
      analyzeRepositoryDto.repositoryUrl,
    );
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_ZIP_UPLOAD_BYTES },
    }),
  )
  analyzeUploadedZip(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'Debes enviar un archivo ZIP en el campo "file" (multipart/form-data)',
      );
    }

    const isZip =
      file.mimetype === 'application/zip' ||
      file.mimetype === 'application/x-zip-compressed' ||
      file.originalname.toLowerCase().endsWith('.zip');

    if (!isZip) {
      throw new BadRequestException(
        'El archivo enviado debe ser un ZIP (.zip)',
      );
    }

    return this.analysisService.analyzeFromZip(file.buffer, file.originalname);
  }
}
