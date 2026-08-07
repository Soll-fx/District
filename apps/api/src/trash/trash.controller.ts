import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrashService } from './trash.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  User,
  type CurrentUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('trash')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trash')
export class TrashController {
  constructor(private readonly trash: TrashService) {}

  @Get()
  @ApiOperation({ summary: 'Удалённые элементы (soft delete)' })
  list(@User() user: CurrentUser) {
    return this.trash.list(user.id);
  }

  @Delete()
  @ApiOperation({ summary: 'Очистить корзину' })
  purgeAll(@User() user: CurrentUser) {
    return this.trash.purgeAll(user.id);
  }
}
