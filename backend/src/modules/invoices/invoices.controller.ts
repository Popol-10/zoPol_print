import { Controller, Get, Param, ParseUUIDPipe, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/entities/user-role.enum';
import { InvoiceEligibleOrderDto } from './dto/invoice-eligible-order.dto';
import { InvoiceSummaryDto } from './dto/invoice-summary.dto';
import { InvoicesService } from './invoices.service';

@ApiTags('Invoices')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.COMMERCIAL)
@Controller({ path: 'invoices', version: VERSION_NEUTRAL })
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOkResponse({ type: InvoiceSummaryDto, isArray: true })
  list(@CurrentUser() actor: AuthenticatedUser): Promise<InvoiceSummaryDto[]> {
    return this.invoicesService.findAll(actor.organizationId);
  }

  @Get('eligible-orders')
  @ApiOkResponse({ type: InvoiceEligibleOrderDto, isArray: true })
  eligibleOrders(@CurrentUser() actor: AuthenticatedUser): Promise<InvoiceEligibleOrderDto[]> {
    return this.invoicesService.findEligibleOrders(actor.organizationId);
  }

  @Post('from-order/:orderId')
  @ApiCreatedResponse({ type: InvoiceSummaryDto })
  issueFromOrder(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<InvoiceSummaryDto> {
    return this.invoicesService.issueFromOrder(actor, orderId);
  }
}
