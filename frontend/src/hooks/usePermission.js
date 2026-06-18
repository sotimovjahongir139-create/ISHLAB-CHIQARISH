import { useAuth } from '../context/AuthContext';

/**
 * Returns { can, hasRole } helpers derived from current user.
 * can('production:create') → true/false
 * hasRole('super_admin', 'admin') → true/false
 */
const usePermission = () => {
  const { user } = useAuth();

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role?.name);
  };

  const can = (permission) => {
    if (!user) return false;
    if (user.role?.name === 'super_admin') return true;
    const perms = user.role?.permissions?.map((rp) => rp.permission?.name) || [];
    return perms.includes(permission);
  };

  const canAny = (...permissions) => permissions.some(can);
  const canAll = (...permissions) => permissions.every(can);

  return { can, canAny, canAll, hasRole };
};

export default usePermission;
