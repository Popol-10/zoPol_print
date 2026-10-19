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
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { SupplierSummaryDto } from './dto/supplier-summary.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller({ path: 'suppliers', version: VERSION_NEUTRAL })
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOkResponse({ type: SupplierSummaryDto, isArray: true })
  list(@CurrentUser() actor: AuthenticatedUser): Promise<SupplierSummaryDto[]> {
    return this.suppliersService.findAll(actor.organizationId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.STOCK_MANAGER)
  @ApiCreatedResponse({ type: SupplierSummaryDto })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateSupplierDto,
  ): Promise<SupplierSummaryDto> {
    return this.suppliersService.create(actor, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.STOCK_MANAGER)
  @ApiOkResponse({ type: SupplierSummaryDto })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) supplierId: string,
    @Body() dto: UpdateSupplierDto,
  ): Promise<SupplierSummaryDto> {
    return this.suppliersService.update(actor, supplierId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(204)
  @ApiNoContentResponse()
  archive(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) supplierId: string,
  ): Promise<void> {
    return this.suppliersService.archive(actor, supplierId);
  }
}
