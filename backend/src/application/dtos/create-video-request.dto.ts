import { IsString, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';

export class CreateVideoRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  userPrompt: string;

  @IsOptional()
  @IsEnum(['16:9', '9:16', '1:1'])
  aspectRatio?: '16:9' | '9:16' | '1:1';
}
