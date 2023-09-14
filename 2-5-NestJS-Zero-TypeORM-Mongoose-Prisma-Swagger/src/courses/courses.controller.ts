import { Controller, Get, Param } from '@nestjs/common';

@Controller('courses')
export class CoursesController {

    @Get()
    public findAll(): string {
        return 'Listagem de cursos';
    }

    @Get(':id')
    public findOne(@Param('id') id: string): string {
        return `Listagem curso ${id}`;
    }
}
