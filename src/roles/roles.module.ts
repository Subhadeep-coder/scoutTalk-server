import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PermissionGuard } from './guards/permissions.guard';
import { Server } from '../database/entities/server.entity';
import { ServerMember } from '../database/entities/server-member.entity';
import { ServerRole } from '../database/entities/server-role.entity';
import { MemberRole } from '../database/entities/member-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server, ServerMember, ServerRole, MemberRole]),
  ],
  controllers: [RolesController],
  providers: [RolesService, PermissionGuard],
  exports: [RolesService, PermissionGuard],
})
export class RolesModule {}
