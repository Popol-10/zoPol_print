import { ApiProperty } from '@nestjs/swagger';
import {
  supportedOrganizationCurrencies,
  supportedOrganizationTimeZones,
} from './update-organization-settings.dto';

export class OrganizationSettingsDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  address: string | null;

  @ApiProperty({ enum: [...supportedOrganizationCurrencies], example: 'MGA' })
  currency: string;

  @ApiProperty({ enum: [...supportedOrganizationTimeZones], example: 'Indian/Antananarivo' })
  timezone: string;
}
