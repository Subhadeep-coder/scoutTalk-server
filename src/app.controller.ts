import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '../docs';
import { AppService } from './app.service';
import { HelloResponseDto } from '../docs/dto/response.dto';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Health Check',
    description:
      'Application health check endpoint. Returns a greeting message.',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    type: HelloResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
