import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateLeadDto {
    @ApiProperty({ example: 'Новый лид', description: 'Заголовок лида', required: false })
    @IsString()
    @IsOptional()
    title?: string

    @ApiProperty({ example: 'Иван', description: 'Имя' })
    @IsString()
    @IsNotEmpty()
    firstName: string

    @ApiProperty({ example: 'Иванов', description: 'Фамилия' })
    @IsString()
    @IsNotEmpty()
    lastName: string

    @ApiProperty({ example: '+79991234567', description: 'Номер телефона', required: false })
    @IsString()
    @IsOptional()
    phone?: string

    @ApiProperty({ example: 'user@example.com', description: 'Email адрес', required: false })
    @IsEmail()
    @IsOptional()
    email?: string

    @ApiProperty({ example: 'Комментарий к лиду', description: 'Комментарий', required: false })
    @IsString()
    @IsOptional()
    comment?: string
}
