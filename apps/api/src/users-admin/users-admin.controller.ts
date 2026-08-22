import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { UseGuards } from '@nestjs/common';
import { UsersAdminService } from './users-admin.service';

@ApiTags('admin-users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/users')
export class UsersAdminController {
  constructor(private readonly users: UsersAdminService) {}

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Patch(':id/ban')
  setBan(@Param('id') id: string, @Body() body: { banned: boolean }) {
    return this.users.setBan(id, body.banned === true);
  }
}
