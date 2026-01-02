import { Controller, Get, Param, Req, Res, NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('files')
export class FilesController {
  @Get('*')
  serveFile(@Req() req: Request, @Res() res: Response) {
    if (process.env.STORAGE_DRIVER !== 'local') {
      throw new NotFoundException('Local storage not enabled');
    }

    // Extraer el path después de /files/
    const fileKey = req.params[0] || '';
    
    if (!fileKey) {
      throw new NotFoundException('File path is required');
    }

    // Seguridad: prevenir path traversal
    const safePath = path.normalize(fileKey).replace(/^(\.\.(\/|\\|$))+/, '');
    const filePath = path.join(process.cwd(), 'storage', safePath);

    // Verificar que el archivo esté dentro del directorio storage
    const storageDir = path.join(process.cwd(), 'storage');
    if (!filePath.startsWith(storageDir)) {
      throw new NotFoundException('Invalid file path');
    }

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    res.sendFile(filePath);
  }
}