import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUser = { id: string; email: string; role: string; sid?: string };

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest<{ user?: CurrentUser }>();
    return request.user as CurrentUser;
  },
);
