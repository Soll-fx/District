import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BrokerService } from './broker.service';
import {
  ConnectBrokerDto,
  DisconnectBrokerDto,
} from './dto/broker.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  User,
  type CurrentUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('broker')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('broker')
export class BrokerController {
  constructor(private readonly broker: BrokerService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'Мои подключённые MT4/MT5 аккаунты' })
  accounts(@User() user: CurrentUser) {
    return this.broker.listAccounts(user.id);
  }

  @Post('connect')
  @ApiOperation({ summary: 'Подключить MT4/MT5 демо счёт' })
  connect(@User() user: CurrentUser, @Body() dto: ConnectBrokerDto) {
    return this.broker.connect(user.id, dto);
  }

  @Post('disconnect')
  @ApiOperation({ summary: 'Отключить MT4/MT5 счёт' })
  disconnect(@User() user: CurrentUser, @Body() dto: DisconnectBrokerDto) {
    return this.broker.disconnect(user.id, dto.id);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Принудительная синхронизация истории сделок' })
  sync(@User() user: CurrentUser) {
    return this.broker.sync(user.id);
  }
}
