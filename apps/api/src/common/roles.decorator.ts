import { SetMetadata } from '@nestjs/common';
import type { AuthContext } from './auth-context.js';
export const ROLES_KEY = 'roles';
export type Role = AuthContext['role'];
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
