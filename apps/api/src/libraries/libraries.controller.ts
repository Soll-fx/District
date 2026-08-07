import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LibrariesService } from './libraries.service';
import {
  CreateAssetDto,
  CreateStrategyDto,
  CreateTagDto,
} from './dto/library.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  User,
  type CurrentUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('libraries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('libraries')
export class LibrariesController {
  constructor(private readonly lib: LibrariesService) {}

  @Get('tags')
  listTags(@User() user: CurrentUser) {
    return this.lib.listTags(user.id);
  }

  @Post('tags')
  createTag(@User() user: CurrentUser, @Body() dto: CreateTagDto) {
    return this.lib.createTag(user.id, dto);
  }

  @Put('tags/:id')
  updateTag(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: CreateTagDto,
  ) {
    return this.lib.updateTag(user.id, id, dto);
  }

  @Delete('tags/:id')
  deleteTag(@User() user: CurrentUser, @Param('id') id: string) {
    return this.lib.deleteTag(user.id, id);
  }

  @Get('assets')
  listAssets(@User() user: CurrentUser) {
    return this.lib.listAssets(user.id);
  }

  @Post('assets')
  createAsset(@User() user: CurrentUser, @Body() dto: CreateAssetDto) {
    return this.lib.createAsset(user.id, dto);
  }

  @Delete('assets/:id')
  deleteAsset(@User() user: CurrentUser, @Param('id') id: string) {
    return this.lib.deleteAsset(user.id, id);
  }

  @Get('strategies')
  listStrategies(@User() user: CurrentUser) {
    return this.lib.listStrategies(user.id);
  }

  @Post('strategies')
  createStrategy(@User() user: CurrentUser, @Body() dto: CreateStrategyDto) {
    return this.lib.createStrategy(user.id, dto);
  }

  @Delete('strategies/:id')
  deleteStrategy(@User() user: CurrentUser, @Param('id') id: string) {
    return this.lib.deleteStrategy(user.id, id);
  }
}
