import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/entities/user-role.enum';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteSummaryDto } from './dto/quote-summary.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { QuotesService } from './quotes.service';

@ApiTags('Quotes')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
@Controller({ path: 'quotes', version: VERSION_NEUTRAL })
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  @ApiOkResponse({ type: QuoteSummaryDto, isArray: true })
  list(@CurrentUser() actor: AuthenticatedUser): Promise<QuoteSummaryDto[]> {
    return this.quotesService.findAll(actor.organizationId);
  }

  @Post()
  @ApiCreatedResponse({ type: QuoteSummaryDto })
  create(@CurrentUser() actor: AuthenticatedUser, @Body() dto: CreateQuoteDto): Promise<QuoteSummaryDto> {
    return this.quotesService.create(actor, dto);
  }

  @Patch(':id/status')
  @ApiOkResponse({ type: QuoteSummaryDto })
  updateStatus(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) quoteId: string,
    @Body() dto: UpdateQuoteStatusDto,
  ): Promise<QuoteSummaryDto> {
    return this.quotesService.updateStatus(actor, quoteId, dto);
  }

  @Post(':id/send')
  @ApiOkResponse({ type: QuoteSummaryDto })
  sendByEmail(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) quoteId: string,
  ): Promise<QuoteSummaryDto> {
    return this.quotesService.sendByEmail(actor, quoteId);
  }

  @Post(':id/convert')
  @ApiOkResponse({ type: QuoteSummaryDto })
  convertToOrder(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) quoteId: string,
  ): Promise<QuoteSummaryDto> {
    return this.quotesService.convertToOrder(actor, quoteId);
  }
}
