// Auth Types
export interface IUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: IUser;
  token: string;
}
