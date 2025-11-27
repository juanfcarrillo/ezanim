import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateVideoRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  userPrompt: string;
}
