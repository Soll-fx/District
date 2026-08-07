import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EmailLoginDto } from './dto/email-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User, type CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация по email и паролю (с подтверждением кода)' })
  register(@Body() dto: RegisterDto, @Request() req) {
    return this.auth.register(dto, {
      userAgent: req.headers?.['user-agent'] as string | undefined,
      req,
    });
  }

  @Post('confirm-registration')
  @ApiOperation({ summary: 'Подтверждение кода при регистрации' })
  confirmRegistration(@Body() dto: VerifyTwoFactorDto, @Request() req) {
    return this.auth.confirmRegistration(dto, {
      userAgent: req.headers?.['user-agent'] as string | undefined,
      req,
    });
  }

  @Post('email-login')
  @ApiOperation({ summary: 'Вход по коду из почты' })
  emailLogin(@Body() dto: EmailLoginDto, @Request() req) {
    return this.auth.emailLogin(dto, {
      userAgent: req.headers?.['user-agent'] as string | undefined,
      req,
    });
  }

  @Post('login')
  @ApiOperation({ summary: 'Вход по email и паролю' })
  login(@Body() dto: LoginDto, @Request() req) {
    return this.auth.login(dto, {
      userAgent: req.headers?.['user-agent'] as string | undefined,
      req,
    });
  }

  @Post('verify-2fa')
  @ApiOperation({ summary: 'Подтверждение 2FA-кода при входе' })
  verifyTwoFactor(@Body() dto: VerifyTwoFactorDto, @Request() req) {
    return this.auth.verifyTwoFactor(dto, {
      userAgent: req.headers?.['user-agent'] as string | undefined,
      req,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Текущий пользователь' })
  me(@Request() req: { user: { id: string } }) {
    return this.auth.me(req.user.id);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Смена пароля' })
  changePassword(
    @Request() req: { user: { id: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.auth.changePassword(req.user.id, dto);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Активные сессии (устройства)' })
  sessions(@User() user: CurrentUser) {
    return this.auth.listSessions(user.id, user.sid);
  }

  @Delete('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Завершить все остальные сессии' })
  revokeOthers(@User() user: CurrentUser) {
    return this.auth.revokeOthers(user.id, user.sid);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Завершить конкретную сессию' })
  revokeSession(@User() user: CurrentUser, @Param('id') id: string) {
    return this.auth.revokeSession(user.id, id);
  }
}
