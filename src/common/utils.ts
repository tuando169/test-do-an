import { RoleEnum } from "./constants";

const permissionMapping = new Map<string, string[]>([
  [
    RoleEnum.Admin,
    [
      "/manage/user",
      "/manage/news",
      "/manage",
      "/manage/space",
      "/manage/resource",
      "/manage/license",
    ],
  ],
  [RoleEnum.Designer, ["/manage", "/manage/space", "/manage/resource"]],
  [RoleEnum.Client, ["/manage", "/manage/space", "/manage/resource"]],
  [
    RoleEnum.Guest,
    ["/", "/listspace", "/news", "/about", "/contact", "/guide", "/info"],
  ],
]);

export function checkRoutePermission(path: string, role: RoleEnum) {
  const allowedPaths = permissionMapping.get(role) || [];
  const publicPaths = permissionMapping.get(RoleEnum.Guest)

  return allowedPaths.includes(path) || publicPaths.includes(path)

}
