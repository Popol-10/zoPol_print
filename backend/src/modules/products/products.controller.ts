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
import { CreateProductDto } from './dto/create-product.dto';
import { ProductSummaryDto } from './dto/product-summary.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@ApiBearerAuth()
@Controller({ path: 'products', version: VERSION_NEUTRAL })
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOkResponse({ type: ProductSummaryDto, isArray: true })
  list(@CurrentUser() actor: AuthenticatedUser): Promise<ProductSummaryDto[]> {
    return this.productsService.findAll(actor.organizationId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.PRODUCTION_MANAGER)
  @ApiCreatedResponse({ type: ProductSummaryDto })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateProductDto,
  ): Promise<ProductSummaryDto> {
    return this.productsService.create(actor, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.PRODUCTION_MANAGER)
  @ApiOkResponse({ type: ProductSummaryDto })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductSummaryDto> {
    return this.productsService.update(actor, productId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(204)
  @ApiNoContentResponse()
  archive(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) productId: string,
  ): Promise<void> {
    return this.productsService.archive(actor, productId);
  }
}
