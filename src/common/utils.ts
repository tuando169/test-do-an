import { RoleEnum } from './constants';

const permissionMapping = new Map<string, string[]>([
  [
    RoleEnum.Admin,
    ['/manage/user', '/manage/news', '/manage', '/manage/space'],
  ],
  [RoleEnum.Designer, ['/manage', '/manage/space', '/manage/resource']],
  [RoleEnum.Client, ['/manage', '/manage/space', '/manage/resource']],
  [
    RoleEnum.Guest,
    ['/', '/listspace', '/news', '/about', '/contact', '/guide', '/info'],
  ],
]);

export function checkRoutePermission(path: string, role: RoleEnum) {
  const allowedPaths = permissionMapping.get(role) || [];
  return (
    allowedPaths.includes(path) ||
    permissionMapping.get(RoleEnum.Guest)?.includes(path)
  );
}
