import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/entities/user-role.enum';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderSummaryDto } from './dto/order-summary.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller({ path: 'orders', version: VERSION_NEUTRAL })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOkResponse({ type: OrderSummaryDto, isArray: true })
  list(@CurrentUser() actor: AuthenticatedUser): Promise<OrderSummaryDto[]> {
    return this.ordersService.findAll(actor.organizationId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  @ApiCreatedResponse({ type: OrderSummaryDto })
  create(@CurrentUser() actor: AuthenticatedUser, @Body() dto: CreateOrderDto): Promise<OrderSummaryDto> {
    return this.ordersService.create(actor, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.PRODUCTION_MANAGER, UserRole.OPERATOR)
  @ApiOkResponse({ type: OrderSummaryDto })
  updateStatus(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderSummaryDto> {
    return this.ordersService.updateStatus(actor, orderId, dto);
  }
}
