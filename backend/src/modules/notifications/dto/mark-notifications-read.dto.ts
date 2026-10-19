import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsString, MaxLength } from 'class-validator';

export class MarkNotificationsReadDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(190, { each: true })
  notificationIds: string[];
}
