import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from '@shared/dto/user.dto';
import { ApiResponse, User } from '@shared/types/common';

@Injectable()
export class UsersService {
  private users: User[] = [];
  private idCounter = 1;

  async create(createUserDto: CreateUserDto): Promise<ApiResponse<User>> {
    const user: User = {
      id: this.idCounter.toString(),
      email: createUserDto.email,
      name: createUserDto.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.push(user);
    this.idCounter++;

    return {
      success: true,
      data: user,
      message: 'User created successfully',
    };
  }

  async findAll(): Promise<ApiResponse<User[]>> {
    return {
      success: true,
      data: this.users,
    };
  }

  async findOne(id: string): Promise<ApiResponse<User>> {
    const user = this.users.find(user => user.id === id);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      success: true,
      data: user,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<ApiResponse<User>> {
    const userIndex = this.users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updateUserDto,
      updatedAt: new Date(),
    };

    return {
      success: true,
      data: this.users[userIndex],
      message: 'User updated successfully',
    };
  }

  async remove(id: string): Promise<ApiResponse<void>> {
    const userIndex = this.users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.users.splice(userIndex, 1);

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }
}