import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StreamsService } from './streams.service';
import {
  CreateStreamDto,
  ToggleReactionDto,
  UpdateStreamDto,
} from './dto/stream.dto';
import { streamUploadOptions } from './upload.config';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import {
  User,
  type CurrentUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('streams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('streams')
export class StreamsController {
  constructor(private readonly streams: StreamsService) {}

  @Get()
  @ApiOperation({ summary: 'Список стримов с реакциями' })
  findAll(@User() user: CurrentUser) {
    return this.streams.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Один стрим' })
  findOne(@User() user: CurrentUser, @Param('id') id: string) {
    return this.streams.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать стрим (админ)' })
  @UseGuards(AdminGuard)
  create(@User() user: CurrentUser, @Body() dto: CreateStreamDto) {
    return this.streams.create(user.id, dto);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Загрузить видеофайл стрима (админ)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('file', streamUploadOptions))
  upload(@UploadedFile() file?: Express.Multer.File) {
    return this.streams.uploadFile(file);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Изменить стрим (админ)' })
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateStreamDto) {
    return this.streams.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить стрим (админ)' })
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.streams.remove(id);
  }

  @Post(':id/react')
  @ApiOperation({ summary: 'Переключить эмодзи-реакцию' })
  react(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ToggleReactionDto,
  ) {
    return this.streams.toggleReaction(user.id, id, dto);
  }
}
