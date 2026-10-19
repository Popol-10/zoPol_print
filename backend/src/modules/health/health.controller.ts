import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

@Public()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  @Get()
  getHealth(): { status: 'ok'; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
