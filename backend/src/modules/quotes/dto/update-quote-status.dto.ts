import { IsEnum } from 'class-validator';
import { QuoteStatus } from '../entities/quote-status.enum';

export class UpdateQuoteStatusDto {
  @IsEnum(QuoteStatus)
  status: QuoteStatus;
}
