import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/entities/user-role.enum';
import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';
import { FinanceTransactionPageDto } from './dto/finance-transaction-page.dto';
import { FinanceTransactionQueryDto } from './dto/finance-transaction-query.dto';
import { FinanceSummaryDto } from './dto/finance-summary.dto';
import { FinanceTransactionSummaryDto } from './dto/finance-transaction-summary.dto';
import { FinanceService } from './finance.service';
import { CreateFinanceOrderPaymentDto } from './dto/create-finance-order-payment.dto';
import { CreateFinanceTransferDto } from './dto/create-finance-transfer.dto';
import { CreateBankReconciliationDto } from './dto/create-bank-reconciliation.dto';
import { BankReconciliationDetailDto } from './dto/bank-reconciliation-detail.dto';
import { BankReconciliationSummaryDto } from './dto/bank-reconciliation-summary.dto';
import { FinanceTransferSummaryDto } from './dto/finance-transfer-summary.dto';
import { OrderSummaryDto } from '../orders/dto/order-summary.dto';

@ApiTags('Finance')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
@Controller({ path: 'finance', version: VERSION_NEUTRAL })
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  @ApiOkResponse({ type: FinanceSummaryDto })
  summary(@CurrentUser() actor: AuthenticatedUser): Promise<FinanceSummaryDto> {
    return this.financeService.summary(actor.organizationId);
  }

  @Get('transactions')
  @ApiOkResponse({ type: FinanceTransactionPageDto })
  transactions(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: FinanceTransactionQueryDto,
  ): Promise<FinanceTransactionPageDto> {
    return this.financeService.findTransactions(actor.organizationId, query);
  }

  @Get('reconciliations')
  @ApiOkResponse({ type: BankReconciliationSummaryDto, isArray: true })
  listReconciliations(@CurrentUser() actor: AuthenticatedUser): Promise<BankReconciliationSummaryDto[]> {
    return this.financeService.listBankReconciliations(actor.organizationId);
  }

  @Get('reconciliations/:id')
  @ApiOkResponse({ type: BankReconciliationDetailDto })
  getReconciliation(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) reconciliationId: string,
  ): Promise<BankReconciliationDetailDto> {
    return this.financeService.getBankReconciliation(actor.organizationId, reconciliationId);
  }

  @Post('reconciliations')
  @ApiCreatedResponse({ type: BankReconciliationDetailDto })
  createReconciliation(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateBankReconciliationDto,
  ): Promise<BankReconciliationDetailDto> {
    return this.financeService.createBankReconciliation(actor, dto);
  }

  @Post('reconciliations/:id/transactions/:transactionId/match')
  @ApiOkResponse({ type: BankReconciliationDetailDto })
  matchReconciliationTransaction(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) reconciliationId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ): Promise<BankReconciliationDetailDto> {
    return this.financeService.setBankReconciliationMatch(actor, reconciliationId, transactionId, true);
  }

  @Delete('reconciliations/:id/transactions/:transactionId/match')
  @ApiOkResponse({ type: BankReconciliationDetailDto })
  unmatchReconciliationTransaction(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) reconciliationId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ): Promise<BankReconciliationDetailDto> {
    return this.financeService.setBankReconciliationMatch(actor, reconciliationId, transactionId, false);
  }

  @Post('reconciliations/:id/complete')
  @ApiOkResponse({ type: BankReconciliationDetailDto })
  completeReconciliation(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) reconciliationId: string,
  ): Promise<BankReconciliationDetailDto> {
    return this.financeService.completeBankReconciliation(actor, reconciliationId);
  }

  @Delete('reconciliations/:id')
  @ApiOkResponse({ type: BankReconciliationDetailDto })
  cancelReconciliation(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) reconciliationId: string,
  ): Promise<BankReconciliationDetailDto> {
    return this.financeService.cancelBankReconciliation(actor, reconciliationId);
  }

  @Post('transfers')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiCreatedResponse({ type: FinanceTransferSummaryDto })
  createTransfer(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateFinanceTransferDto,
  ): Promise<FinanceTransferSummaryDto> {
    return this.financeService.createTransfer(actor, dto);
  }

  @Post('orders/:orderId/payments')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.COMMERCIAL)
  @ApiCreatedResponse({ type: OrderSummaryDto })
  receiveOrderPayment(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: CreateFinanceOrderPaymentDto,
  ): Promise<OrderSummaryDto> {
    return this.financeService.receiveOrderPayment(actor, orderId, dto);
  }

  @Post('transactions')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiCreatedResponse({ type: FinanceTransactionSummaryDto })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateFinanceTransactionDto,
  ): Promise<FinanceTransactionSummaryDto> {
    return this.financeService.create(actor, dto);
  }
}
