import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateCompanyDto {
    @ApiProperty({ example: 'ООО Ромашка', description: 'Название компании' })
    @IsString()
    @IsNotEmpty()
    title: string

    @ApiProperty({ example: '+79991234567', description: 'Телефон', required: false })
    @IsString()
    @IsOptional()
    phone?: string

    @ApiProperty({ example: 'info@romashka.ru', description: 'Email', required: false })
    @IsEmail()
    @IsOptional()
    email?: string

    @ApiProperty({ example: 'https://romashka.ru', description: 'Сайт', required: false })
    @IsString()
    @IsOptional()
    website?: string

    @ApiProperty({
        example: 'г. Москва, ул. Пушкина, д. 1',
        description: 'Фактический адрес',
        required: false,
    })
    @IsString()
    @IsOptional()
    address?: string

    @ApiProperty({ example: 50000000, description: 'Годовой оборот (в рублях)', required: false })
    @IsNumber()
    @IsOptional()
    annualRevenue?: number

    @ApiProperty({ example: 25, description: 'Количество сотрудников', required: false })
    @IsNumber()
    @IsOptional()
    employeesCount?: number

    @ApiProperty({ example: '7701234567', description: 'ИНН' })
    @IsString()
    @IsNotEmpty()
    inn: string

    @ApiProperty({ example: '770101001', description: 'КПП', required: false })
    @IsString()
    @IsOptional()
    kpp?: string

    @ApiProperty({ example: '1027700132195', description: 'ОГРН', required: false })
    @IsString()
    @IsOptional()
    ogrn?: string

    @ApiProperty({
        example: 'г. Москва, ул. Пушкина, д. 1',
        description: 'Юридический адрес',
        required: false,
    })
    @IsString()
    @IsOptional()
    legalAddress?: string

    @ApiProperty({ example: 'АО Сбербанк', description: 'Название банка', required: false })
    @IsString()
    @IsOptional()
    bankName?: string

    @ApiProperty({
        example: '40702810123450101234',
        description: 'Расчётный счёт',
        required: false,
    })
    @IsString()
    @IsOptional()
    bankAccount?: string

    @ApiProperty({ example: '044525225', description: 'БИК', required: false })
    @IsString()
    @IsOptional()
    bankBik?: string

    @ApiProperty({
        example: '30101810400000000225',
        description: 'Корреспондентский счёт',
        required: false,
    })
    @IsString()
    @IsOptional()
    bankCorrAccount?: string

    @ApiProperty({ example: 'Клиент пришёл с сайта', description: 'Комментарий', required: false })
    @IsString()
    @IsOptional()
    comment?: string
}
