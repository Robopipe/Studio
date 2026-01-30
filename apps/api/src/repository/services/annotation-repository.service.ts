import { Inject, Injectable } from '@nestjs/common';
import { annotationTable } from '@repo/database/schema';
import { DB_CONNECTION } from 'src/core/database/database.constant';
import type { DbConnection } from 'src/core/database/types/database.types';

@Injectable()
export class AnnotationRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}
}
