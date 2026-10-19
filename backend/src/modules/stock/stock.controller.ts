import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/entities/user-role.enum';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { CountStockItemDto } from './dto/count-stock-item.dto';
import { StockItemSummaryDto } from './dto/stock-item-summary.dto';
import { StockMovementSummaryDto } from './dto/stock-movement-summary.dto';
import { StockMovementPageDto } from './dto/stock-movement-page.dto';
import { StockMovementQueryDto } from './dto/stock-movement-query.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { StockService } from './stock.service';

@ApiTags('Stock')
@ApiBearerAuth()
@Controller({ path: 'stock', version: VERSION_NEUTRAL })
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('items')
  @ApiOkResponse({ type: StockItemSummaryDto, isArray: true })
  listItems(@CurrentUser() actor: AuthenticatedUser) {
    return this.stockService.findAllItems(actor.organizationId);
  }

  @Post('items')
  @Roles(UserRole.ADMIN, UserRole.STOCK_MANAGER)
  @ApiCreatedResponse({ type: StockItemSummaryDto })
  createItem(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateStockItemDto,
  ): Promise<StockItemSummaryDto> {
    return this.stockService.createItem(actor, dto);
  }

  @Patch('items/:id')
  @Roles(UserRole.ADMIN, UserRole.STOCK_MANAGER)
  @ApiOkResponse({ type: StockItemSummaryDto })
  updateItem(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateStockItemDto,
  ): Promise<StockItemSummaryDto> {
    return this.stockService.updateItem(actor, itemId, dto);
  }

  @Delete('items/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(204)
  @ApiNoContentResponse()
  archiveItem(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) itemId: string,
  ): Promise<void> {
    return this.stockService.archiveItem(actor, itemId);
  }

  @Post('items/:id/count')
  @Roles(
    UserRole.ADMIN,
    UserRole.STOCK_MANAGER,
    UserRole.PRODUCTION_MANAGER,
    UserRole.OPERATOR,
  )
  @ApiCreatedResponse({ type: StockMovementSummaryDto })
  countItem(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) itemId: string,
    @Body() dto: CountStockItemDto,
  ): Promise<StockMovementSummaryDto> {
    return this.stockService.countItem(actor, itemId, dto);
  }

  @Get('movements')
  @ApiOkResponse({ type: StockMovementPageDto })
  listMovements(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: StockMovementQueryDto,
  ): Promise<StockMovementPageDto> {
    return this.stockService.findAllMovements(actor.organizationId, query);
  }

  @Get('items/:id/movements')
  @ApiOkResponse({ type: StockMovementSummaryDto, isArray: true })
  listItemMovements(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) itemId: string,
  ): Promise<StockMovementSummaryDto[]> {
    return this.stockService.findMovements(actor.organizationId, itemId);
  }

  @Post('movements')
  @Roles(UserRole.ADMIN, UserRole.STOCK_MANAGER, UserRole.PRODUCTION_MANAGER, UserRole.OPERATOR)
  @ApiCreatedResponse({ type: StockMovementSummaryDto })
  createMovement(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateStockMovementDto,
  ): Promise<StockMovementSummaryDto> {
    return this.stockService.createMovement(actor, dto);
  }
}
