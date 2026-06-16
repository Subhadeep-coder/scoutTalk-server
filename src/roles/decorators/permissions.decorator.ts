import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export interface PermissionsMetadata {
  permission: string;
  paramName?: string;
}

export const Permissions = (
  permission: bigint,
  paramName = 'serverId',
) =>
  SetMetadata<string, PermissionsMetadata>(PERMISSIONS_KEY, {
    permission: permission.toString(),
    paramName,
  });
