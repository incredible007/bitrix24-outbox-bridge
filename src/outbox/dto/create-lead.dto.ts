import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateLeadDto {
    @IsString()
    @IsOptional()
    title?: string

    @IsString()
    @IsNotEmpty()
    firstName: string

    @IsString()
    @IsNotEmpty()
    lastName: string

    @IsString()
    @IsOptional()
    phone?: string

    @IsEmail()
    @IsOptional()
    email?: string

    @IsString()
    @IsOptional()
    comment?: string
}
