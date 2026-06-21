import { buildAvatarUrl } from '@/utils/avatarUrl';
import { resolveUploadUrl } from '@/utils/mediaUrl';

function resolveAuthorAvatar(
  name: string,
  loginOrEmail?: string,
  avatarUrl?: string | null,
): string {
  if (avatarUrl) {
    return resolveUploadUrl(avatarUrl);
  }
  return buildAvatarUrl(name, loginOrEmail ?? name);
}

export {
  resolveAuthorAvatar,
};
