import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import type { Token, User as UserDto } from '@repo/schema';
import type { Request, Response } from 'express';
import type { UserEntity } from 'src/modules/user/entities/user.entity';
import { Cookie } from '../decorators/cookie.decorator';
import { Public } from '../decorators/public.decorator';
import { User } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthService } from '../services/auth.service';
import { RegisterDto, UserUpdateRequest } from "../dto/auth.dto";

@Controller('auth')
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'test@example.com' },
        password: { type: 'string', example: 'testpassword' },
      },
    },
  })
  login(@Req() req: Request, @Res({ passthrough: true }) res: Response): Token {
    return this.authService.login(req.user!, res);
  }

  @Post('refresh')
  refresh(@Cookie({ name: 'refreshToken', signed: true }) refreshToken?: string): Promise<Token> {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token cookie');
    }

    return this.authService.refreshLogin(refreshToken);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.authService.logout(res);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@User() user: UserEntity): UserDto {
    return user.toDto();
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@User() user: UserEntity, @Body() data: UserUpdateRequest): Promise<UserDto> {
    const updatedUser = await this.authService.updateProfile(user.id, data);
    return updatedUser.toDto();
  }

  @Post("register")
  public register(@Body() data: RegisterDto, @Res({passthrough: true}) res: Response): Promise<Token>{
    return this.authService.register(data, res)
  }
}
