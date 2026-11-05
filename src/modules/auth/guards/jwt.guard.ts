import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthException } from '../../common/exceptions/index.js';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);
    if (!token) throw new AuthException();

    try {
      (req as unknown as Record<string, unknown>)['user'] = this.jwt.verify(token);
    } catch {
      throw new AuthException();
    }
    return true;
  }

  private extractToken(req: Request): string | undefined {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
