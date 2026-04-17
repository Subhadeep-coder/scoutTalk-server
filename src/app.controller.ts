import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '../docs';
import { AppService } from './app.service';
import { HelloResponseDto } from '../docs/dto/response.dto';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
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
  getHello(): string {
    return this.appService.getHello();
  }
}
