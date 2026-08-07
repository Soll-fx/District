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
import { PromosService } from './promos.service';
import { CreatePromoDto, UpdatePromoDto } from './dto/promo.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import {
  User,
  type CurrentUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('promos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/promos')
export class PromosController {
  constructor(private readonly promos: PromosService) {}

  @Get()
  @ApiOperation({ summary: 'Список промокодов' })
  findAll() {
    return this.promos.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Создать промокод' })
  create(@User() user: CurrentUser, @Body() dto: CreatePromoDto) {
    return this.promos.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Изменить промокод' })
  update(@Param('id') id: string, @Body() dto: UpdatePromoDto) {
    return this.promos.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить промокод' })
  remove(@Param('id') id: string) {
    return this.promos.remove(id);
  }
}
