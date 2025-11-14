import { Injectable } from '@nestjs/common';
import { User, Session } from './model/user.model';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  private users: User[] = [];

  signup(signupDto: SignupDto): User {
    console.log({signupDto});
    
    const exists = this.users.find(u => u.email === signupDto.email);
    console.log({exists});
    
    if (exists) throw new Error("User already exists");
    const newUser: User = {
      userId: uuidv4(),
      ...signupDto,
      sessions: []
    };
    this.users.push(newUser);
    return newUser;
  }

  login(loginDto: LoginDto): User | undefined {
    console.log(loginDto);
    
    const user = this.users.find(
      u => u.email === loginDto.email && u.password === loginDto.password,
    );
    console.log({user});
    
    return user;
  }

  findByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }

  getAll(): User[] {
    return this.users;
  }

  addSession(email: string, session: Session): Session | undefined {
    const user = this.findByEmail(email);
    if (!user) return undefined;
    user.sessions.push(session);
    return session;
  }
}
