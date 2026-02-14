import ACCESS_ENUM from '@/access/accessEnum';

/**
 * 检查权限（判断当前登录用户是否具有某个权限）
 * @param loginUser 当前登录用户
 * @param needAccess 需要有的权限（可以是单个权限或权限数组）
 * @return boolean 有无权限
 */
const checkAccess = (
  loginUser: any,
  needAccess: string | string[] = ACCESS_ENUM.NOT_LOGIN
) => {
  // 获取当前登录用户具有的权限（如果没有 loginUser，则表示未登录）
  const loginUserAccess = loginUser?.userRole ?? ACCESS_ENUM.NOT_LOGIN;

  // 将needAccess统一为数组处理
  const needAccessList = Array.isArray(needAccess) ? needAccess : [needAccess];

  // 如果不需要任何权限，直接放行
  if (needAccessList.includes(ACCESS_ENUM.NOT_LOGIN)) {
    return true;
  }

  // 检查用户是否已登录（对于学生/教师权限，需要登录）
  const needStudentOrTeacher =
    needAccessList.includes(ACCESS_ENUM.STUDENT) ||
    needAccessList.includes(ACCESS_ENUM.TEACHER);
  if (needStudentOrTeacher) {
    if (loginUserAccess === ACCESS_ENUM.NOT_LOGIN) {
      return false;
    }
  }

  // 如果需要管理员权限
  if (needAccessList.includes(ACCESS_ENUM.ADMIN)) {
    if (loginUserAccess !== ACCESS_ENUM.ADMIN) {
      return false;
    }
  }

  return true;
};

export default checkAccess;
