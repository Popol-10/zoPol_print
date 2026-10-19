import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { UserRole } from '../users/entities/user-role.enum';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderSummaryDto } from './dto/purchase-order-summary.dto';
import { CreatePurchaseReceiptDto } from './dto/create-purchase-receipt.dto';
import { PurchaseReceiptSummaryDto } from './dto/purchase-receipt-summary.dto';
import { PurchasesService } from './purchases.service';

@ApiTags('Purchases')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.STOCK_MANAGER)
@Controller({ path: 'purchases', version: VERSION_NEUTRAL })
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  @ApiOkResponse({ type: PurchaseOrderSummaryDto, isArray: true })
  list(@CurrentUser() actor: AuthenticatedUser): Promise<PurchaseOrderSummaryDto[]> {
    return this.purchasesService.findAll(actor.organizationId);
  }

  @Get('receipts')
  @ApiOkResponse({ type: PurchaseReceiptSummaryDto, isArray: true })
  listReceipts(@CurrentUser() actor: AuthenticatedUser): Promise<PurchaseReceiptSummaryDto[]> {
    return this.purchasesService.findAllReceipts(actor.organizationId);
  }

  @Post()
  @ApiCreatedResponse({ type: PurchaseOrderSummaryDto })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreatePurchaseOrderDto,
  ): Promise<PurchaseOrderSummaryDto> {
    return this.purchasesService.create(actor, dto);
  }

  @Post(':id/receipts')
  @ApiCreatedResponse({ type: PurchaseReceiptSummaryDto })
  receive(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) purchaseOrderId: string,
    @Body() dto: CreatePurchaseReceiptDto,
    @Req() request: Request,
  ): Promise<PurchaseReceiptSummaryDto> {
    const userAgent = request.headers['user-agent'];
    return this.purchasesService.receive(actor, purchaseOrderId, dto, {
      ip: request.ip,
      userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
    });
  }
}
