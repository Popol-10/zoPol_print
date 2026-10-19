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
import { ClientSummaryDto } from './dto/client-summary.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientsService } from './clients.service';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller({ path: 'clients', version: VERSION_NEUTRAL })
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOkResponse({ type: ClientSummaryDto, isArray: true })
  list(@CurrentUser() actor: AuthenticatedUser): Promise<ClientSummaryDto[]> {
    return this.clientsService.findAll(actor.organizationId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  @ApiCreatedResponse({ type: ClientSummaryDto })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateClientDto,
  ): Promise<ClientSummaryDto> {
    return this.clientsService.create(actor, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  @ApiOkResponse({ type: ClientSummaryDto })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) clientId: string,
    @Body() dto: UpdateClientDto,
  ): Promise<ClientSummaryDto> {
    return this.clientsService.update(actor, clientId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(204)
  @ApiNoContentResponse()
  archive(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) clientId: string,
  ): Promise<void> {
    return this.clientsService.archive(actor, clientId);
  }
}
