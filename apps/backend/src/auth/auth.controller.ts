import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { ThrottleByEmail } from '../common/throttling';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Per IP: 10 accounts per hour.
  @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
  @Post('register')
  register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  // Per IP: 20 attempts per minute; per e-mail: 10 per 15 minutes.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ThrottleByEmail()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() data: LoginDto) {
    return this.authService.login(data.email, data.password);
  }
}
