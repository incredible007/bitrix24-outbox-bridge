import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateContactDto {
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
    @IsNotEmpty()
    phone: string

    @ApiProperty({
        example: 'user@example.com',
        description: 'Email пользователя который зарегистрировался',
        required: false,
    })
    @IsEmail()
    @IsNotEmpty()
    email: string

    @ApiProperty({ example: 'Комментарий к контакту', description: 'Комментарий', required: false })
    @IsString()
    @IsOptional()
    comment?: string
}
