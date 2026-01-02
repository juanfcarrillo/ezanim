import { Controller, Get, Req, Res, NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('poc')
export class FilesController {
  @Get('files/*')
  serveFile(@Req() req: Request, @Res() res: Response) {
    if (process.env.STORAGE_DRIVER !== 'local') {
      throw new NotFoundException('Local storage not enabled');
    }

    // Extraer el path después de /poc/files/
    const fileKey = req.params[0] || req.path.replace(/^\/poc\/files\/?/, '');
    
    console.log('Requested file:', fileKey);
    
    if (!fileKey) {
      throw new NotFoundException('File path is required');
    }

    // Seguridad: prevenir path traversal
    const safePath = path.normalize(fileKey).replace(/^(\.\.(\/|\\|$))+/, '');
    const filePath = path.join(process.cwd(), 'storage', safePath);

    console.log('Full file path:', filePath);

    // Verificar que el archivo esté dentro del directorio storage
    const storageDir = path.join(process.cwd(), 'storage');
    if (!filePath.startsWith(storageDir)) {
      throw new NotFoundException('Invalid file path');
    }

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File not found: ${safePath}`);
    }

    // Detectar tipo de contenido basado en extensión
    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap: { [key: string]: string } = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    res.sendFile(filePath);
  }
}