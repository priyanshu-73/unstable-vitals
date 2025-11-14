import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    const user = await this.userService.signup(signupDto);
    if (!user) return { success: false, message: 'User already exists' };
    return user;
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.userService.login(loginDto);
    if (!user) return { success: false, message: 'Invalid credentials' };
    const { password, ...result } = user.toObject();
    return { success: true, user: result };
  }

  @Get(':userId')
  async getUser(@Param('userId') userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) return { message: 'User not found' };
    const { password, ...result } = user.toObject();
    return result;
  }

  @Get()
  async getUsers() {
    const users = await this.userService.getAll();
    return users.map((u) => {
      const { password, ...rest } = u.toObject();
      return rest;
    });
  }
}
