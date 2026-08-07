import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountsService, type AccountDto } from './accounts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  User,
  type CurrentUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Список счетов' })
  list(@User() user: CurrentUser) {
    return this.accounts.list(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать счёт' })
  create(@User() user: CurrentUser, @Body() dto: AccountDto) {
    return this.accounts.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить счёт' })
  update(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: AccountDto,
  ) {
    return this.accounts.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить счёт' })
  remove(@User() user: CurrentUser, @Param('id') id: string) {
    return this.accounts.remove(user.id, id);
  }
}
