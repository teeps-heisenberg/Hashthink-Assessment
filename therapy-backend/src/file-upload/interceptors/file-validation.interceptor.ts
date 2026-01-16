import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { FileValidationService } from '../file-validation.service';

@Injectable()
export class FileValidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(FileValidationInterceptor.name);

  constructor(private readonly fileValidationService: FileValidationService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const file = request.file as Express.Multer.File;

    // Check if file exists
    if (!file) {
      this.logger.warn('No file provided in request');
      throw new BadRequestException('No audio file provided');
    }

    // Validate the file
    const validationResult = this.fileValidationService.validateFile(file);

    if (!validationResult.isValid) {
      this.logger.warn(`File validation failed: ${validationResult.error}`);
      throw new BadRequestException(validationResult.error);
    }

    this.logger.log(`File validation passed: ${file.originalname}`);

    // Continue to the controller
    return next.handle();
  }
}
