import { PartialType } from '@nestjs/swagger';
import { CreateBanquetDto } from './create-banquet.dto';

/**
 * DTO for updating an existing banquet
 * All fields are optional
 */
export class UpdateBanquetDto extends PartialType(CreateBanquetDto) { }
