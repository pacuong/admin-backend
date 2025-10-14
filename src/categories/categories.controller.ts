import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthRequest } from 'src/common/interfaces/auth-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  getAll(@Request() req: AuthRequest) {
    const isAdmin = req.user?.role === 'admin';
    return this.categoriesService.findAll(isAdmin);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Request() req: AuthRequest) {
    const isAdmin = req.user?.role === 'admin';
    return this.categoriesService.findOne(id, isAdmin);
  }

  @Post('create')
  create(@Request() req: AuthRequest, @Body() dto: CreateCategoryDto) {
    if (req.user?.role !== 'admin') throw new UnauthorizedException();
    return this.categoriesService.create(dto);
  }

  @Put(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    if (req.user?.role !== 'admin') throw new UnauthorizedException();
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    if (req.user?.role !== 'admin') throw new UnauthorizedException();
    return this.categoriesService.remove(id);
  }
}
