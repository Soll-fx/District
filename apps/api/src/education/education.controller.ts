import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EducationService } from './education.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('education')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('education')
export class EducationController {
  constructor(private readonly education: EducationService) {}

  @Get('courses')
  @ApiOperation({ summary: 'Курсы Академии' })
  courses() {
    return this.education.courses();
  }
}
