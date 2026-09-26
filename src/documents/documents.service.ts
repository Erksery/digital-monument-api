import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class DocumentsService {
  async getDocument(slug: string) {
    const allowed = new Set([
      'about',
      'faq',
      'privacy',
      'terms',
      'public-offer',
    ]);

    if (!allowed.has(slug)) {
      throw new NotFoundException();
    }
    const filePath = join(process.cwd(), 'documents', `${slug}.md`);

    try {
      const markdown = await fs.readFile(filePath, 'utf-8');

      return {
        slug,
        markdown,
      };
    } catch {
      throw new NotFoundException(`Документ "${slug}" не найден`);
    }
  }
}
