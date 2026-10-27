import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

const DATABASE_CONNECTION_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_SEQUENCE_TIMEOUT',
]);

function isDatabaseConnectionError(exception: unknown): boolean {
  if (!(exception instanceof QueryFailedError)) return false;
  const code = (exception.driverError as { code?: unknown }).code;
  return typeof code === 'string' && DATABASE_CONNECTION_ERROR_CODES.has(code);
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const databaseUnavailable = isDatabaseConnectionError(exception);
    const status =
      databaseUnavailable
        ? HttpStatus.SERVICE_UNAVAILABLE
        : exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
    const rawResponse = exception instanceof HttpException ? exception.getResponse() : undefined;
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        'Unhandled request: ' + request.method + ' ' + request.url,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }
    const details = typeof rawResponse === 'object' && rawResponse !== null ? rawResponse : {};
    const message = databaseUnavailable
      ? 'La base de données est temporairement indisponible. Réessayez dans quelques instants.'
      : typeof rawResponse === 'string'
        ? rawResponse
        : ((details as { message?: string | string[] }).message ?? 'Erreur interne du serveur');

    response.status(status).json({
      statusCode: status,
      code: HttpStatus[status],
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
