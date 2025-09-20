import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from '@shared/dto/user.dto';
import { ApiResponse, User } from '@shared/types/common';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create user', description: 'Create a new user account' })
  @ApiBody({ type: CreateUserDto })
  @SwaggerApiResponse({ status: 201, description: 'User created successfully' })
  @SwaggerApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponse<User>> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users', description: 'Retrieve a list of all users' })
  @SwaggerApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(): Promise<ApiResponse<User[]>> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID', description: 'Retrieve a specific user by their ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @SwaggerApiResponse({ status: 200, description: 'User found successfully' })
  @SwaggerApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<User>> {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user', description: 'Update an existing user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  @SwaggerApiResponse({ status: 200, description: 'User updated successfully' })
  @SwaggerApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<User>> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user', description: 'Delete a user account' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @SwaggerApiResponse({ status: 200, description: 'User deleted successfully' })
  @SwaggerApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string): Promise<ApiResponse<void>> {
    return this.usersService.remove(id);
  }
}