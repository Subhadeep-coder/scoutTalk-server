export const Permissions = {
  VIEW_CHANNEL: 1n << 0n,
  MANAGE_CHANNELS: 1n << 1n,
  MANAGE_ROLES: 1n << 2n,
  CREATE_EXPRESSIONS: 1n << 3n,
  MANAGE_EXPRESSIONS: 1n << 4n,
  VIEW_AUDIT_LOG: 1n << 5n,
  VIEW_SERVER_INSIGHTS: 1n << 6n,
  MANAGE_WEBHOOKS: 1n << 7n,
  MANAGE_GUILD: 1n << 8n,

  CREATE_INSTANT_INVITE: 1n << 9n,
  CHANGE_NICKNAME: 1n << 10n,
  MANAGE_NICKNAMES: 1n << 11n,
  KICK_MEMBERS: 1n << 12n,
  BAN_MEMBERS: 1n << 13n,
  MODERATE_MEMBERS: 1n << 14n,

  SEND_MESSAGES: 1n << 15n,
  EMBED_LINKS: 1n << 16n,
  ATTACH_FILES: 1n << 17n,
  ADD_REACTIONS: 1n << 18n,
  USE_EXTERNAL_EMOJIS: 1n << 19n,
  USE_EXTERNAL_STICKERS: 1n << 20n,
  MENTION_EVERYONE: 1n << 21n,
  MANAGE_MESSAGES: 1n << 22n,
  READ_MESSAGE_HISTORY: 1n << 23n,
  SEND_TTS_MESSAGES: 1n << 24n,

  CONNECT: 1n << 25n,
  SPEAK: 1n << 26n,
  VIDEO: 1n << 27n,
  USE_VAD: 1n << 28n,
  PRIORITY_SPEAKER: 1n << 29n,
  MUTE_MEMBERS: 1n << 30n,
  DEAFEN_MEMBERS: 1n << 31n,
  MOVE_MEMBERS: 1n << 32n,
  SET_VOICE_CHANNEL_STATUS: 1n << 33n,
  REQUEST_TO_SPEAK: 1n << 34n,
  USE_SOUNDBOARD: 1n << 35n,
  USE_EXTERNAL_SOUNDS: 1n << 36n,
} as const;

export type PermissionKey = keyof typeof Permissions;

export const ALL_PERMISSIONS = (1n << 37n) - 1n;

export const EVERYONE_DEFAULT_PERMISSIONS =
  Permissions.VIEW_CHANNEL |
  Permissions.CREATE_INSTANT_INVITE |
  Permissions.CHANGE_NICKNAME |
  Permissions.SEND_MESSAGES |
  Permissions.EMBED_LINKS |
  Permissions.ATTACH_FILES |
  Permissions.ADD_REACTIONS |
  Permissions.READ_MESSAGE_HISTORY |
  Permissions.CONNECT |
  Permissions.SPEAK |
  Permissions.VIDEO |
  Permissions.USE_VAD;

export function hasPermission(
  permissionBits: bigint,
  required: bigint,
): boolean {
  return (permissionBits & required) !== 0n;
}

export function addPermission(
  permissionBits: bigint,
  permission: bigint,
): bigint {
  return permissionBits | permission;
}

export function removePermission(
  permissionBits: bigint,
  permission: bigint,
): bigint {
  return permissionBits & ~permission;
}

export function permissionsToArray(permissionBits: bigint): PermissionKey[] {
  const granted: PermissionKey[] = [];
  for (const [key, value] of Object.entries(Permissions)) {
    if ((permissionBits & (value as bigint)) !== 0n) {
      granted.push(key as PermissionKey);
    }
  }
  return granted;
}

export function arrayToPermissions(
  keys: PermissionKey[],
): bigint {
  let bits = 0n;
  for (const key of keys) {
    bits |= Permissions[key];
  }
  return bits;
}
