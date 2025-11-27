import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('files')
export class FilesController {
  @Get('*')
  serveFile(@Param('0') fileKey: string, @Res() res: Response) {
    if (process.env.STORAGE_DRIVER !== 'local') {
      throw new NotFoundException('Local storage not enabled');
    }

    const filePath = path.join(process.cwd(), 'storage', fileKey);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    res.sendFile(filePath);
  }
}
