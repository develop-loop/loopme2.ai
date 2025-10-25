export class CreateUserDto {
  email: string;
  name: string;
}

export class UpdateUserDto {
  email?: string;
  name?: string;
}