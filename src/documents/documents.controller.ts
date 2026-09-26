import { Controller, Get, Param } from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get(':slug')
  getDocument(@Param('slug') slug: string) {
    return this.documentsService.getDocument(slug);
  }
}
