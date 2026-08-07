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
import { TournamentsService } from './tournaments.service';
import {
  CreateTournamentDto,
  RecordResultDto,
  StartTournamentDto,
  UpdateMatchDto,
} from './dto/tournament.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import {
  User,
  type CurrentUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('tournaments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournaments: TournamentsService) {}

  @Get()
  @ApiOperation({ summary: 'Список турниров' })
  list(@User() user: CurrentUser) {
    return this.tournaments.list(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Турнир с сеткой' })
  findOne(@User() user: CurrentUser, @Param('id') id: string) {
    return this.tournaments.findOne(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать турнир (админ)' })
  @UseGuards(AdminGuard)
  create(@Body() dto: CreateTournamentDto) {
    return this.tournaments.create(dto);
  }

  @Post(':id/open')
  @ApiOperation({ summary: 'Открыть регистрацию (админ)' })
  @UseGuards(AdminGuard)
  open(@Param('id') id: string) {
    return this.tournaments.open(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Отменить турнир (админ)' })
  @UseGuards(AdminGuard)
  cancel(@Param('id') id: string) {
    return this.tournaments.cancel(id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Запустить и построить сетку (админ)' })
  @UseGuards(AdminGuard)
  start(@Param('id') id: string, @Body() dto?: StartTournamentDto) {
    return this.tournaments.start(id, dto);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Подать заявку на турнир' })
  join(@User() user: CurrentUser, @Param('id') id: string) {
    return this.tournaments.join(id, user.id);
  }

  @Delete(':id/join')
  @ApiOperation({ summary: 'Отменить заявку' })
  leave(@User() user: CurrentUser, @Param('id') id: string) {
    return this.tournaments.leave(id, user.id);
  }

  @Get(':id/matches/:matchId')
  @ApiOperation({ summary: 'Матч с живыми счетами и сделками' })
  match(@Param('id') id: string, @Param('matchId') matchId: string) {
    return this.tournaments.getMatchDetail(id, matchId);
  }

  @Post(':id/matches/:matchId/score')
  @ApiOperation({
    summary: 'Подсчитать счёт и зафиксировать победителя (админ)',
  })
  @UseGuards(AdminGuard)
  score(@Param('id') id: string, @Param('matchId') matchId: string) {
    return this.tournaments.scoreMatch(id, matchId);
  }

  @Post(':id/matches/:matchId/result')
  @ApiOperation({ summary: 'Ручной результат матча (админ)' })
  @UseGuards(AdminGuard)
  result(
    @Param('id') id: string,
    @Param('matchId') matchId: string,
    @Body() dto: RecordResultDto,
  ) {
    return this.tournaments.recordResult(id, matchId, dto);
  }

  @Patch(':id/matches/:matchId')
  @ApiOperation({ summary: 'Окно дуэли / стрим / статус матча (админ)' })
  @UseGuards(AdminGuard)
  updateMatch(
    @Param('id') id: string,
    @Param('matchId') matchId: string,
    @Body() dto: UpdateMatchDto,
  ) {
    return this.tournaments.updateMatch(id, matchId, dto);
  }
}
