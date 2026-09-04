import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedRequest } from './auth-context.js';
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<AuthenticatedRequest>();
    const res = http.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : undefined;
    const message = typeof raw === 'string' ? raw : (typeof raw === 'object' && raw && 'message' in raw ? raw.message : 'An unexpected error occurred.');
    const code=typeof raw==='object'&&raw&&'code'in raw&&typeof raw.code==='string'?raw.code:status===500?'INTERNAL_ERROR':`HTTP_${status}`;
    res.status(status).json({ error: { code, message, requestId: req.requestId } });
  }
}
