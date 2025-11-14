import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { v4 as uuidv4 } from 'uuid';
import { Session } from '../session/model/session.model';
import * as bcrypt from 'bcrypt';
import { User } from './model/user.model';
import { CreateSessionDto } from '../session/dto/session.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Session') private sessionModel: Model<Session>,
  ) {}

  async signup(signupDto: SignupDto): Promise<User | null> {
    const exists = await this.userModel
      .findOne({ email: signupDto.email })
      .exec();
    if (exists) return null;
    const hashedPassword = await bcrypt.hash(signupDto.password, 10);
    const created = new this.userModel({
      userId: uuidv4(),
      ...signupDto,
      password: hashedPassword,
    });
    return created.save();
  }

  async login(loginDto: LoginDto): Promise<User | null> {
    const user = await this.userModel.findOne({ email: loginDto.email }).exec();
    if (user && (await bcrypt.compare(loginDto.password, user.password))) {
      return user;
    }
    return null;
  }

  async findById(userId: string): Promise<User | null> {
    return this.userModel.findOne({ _id: userId }).populate('sessions').exec();
  }

  async getAll(): Promise<User[]> {
    return this.userModel.find().populate('sessions').exec();
  }

  // Create a session document and push its ObjectId to user's sessions array
  async addSession(dto: CreateSessionDto): Promise<Session | null> {    
    const sessionData = {
      ...dto,
      emergency: false,
      startTime: new Date(),
      endTime: new Date(),
    };
    
    const session = new this.sessionModel(sessionData);
    const savedSession = await session.save();

    const updatedUser = await this.userModel
      .findOneAndUpdate(
        { _id: dto.userId },
        { $push: { sessions: savedSession._id } },
        { new: true },
      )
      .exec();

    if (!updatedUser) return null;

    return savedSession;
  }
}
