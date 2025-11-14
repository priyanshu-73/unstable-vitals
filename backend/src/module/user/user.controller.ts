import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return this.userService.signup(signupDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    const user = this.userService.login(loginDto);
    if (!user) return { success: false, message: 'Invalid credentials' };
    const { password, ...result } = user;
    return { success: true, user: result };
  }

  @Get(':email')
  getUser(@Param('email') email: string) {
    const user = this.userService.findByEmail(email);
    if (!user) return { message: 'User not found' };
    const { password, ...result } = user;
    return result;
  }

  @Get()
  getUsers() {
    return this.userService.getAll().map((u) => {
      const { password, ...rest } = u;
      return rest;
    });
  }
}
