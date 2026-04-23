export type AppRole = "user" | "deliveryBoy" | "admin"

export const dashboardRoutes: Record<AppRole, string> = {
  user: "/user/dashboard",
  deliveryBoy: "/delivery/dashboard",
  admin: "/admin/dashboard",
}

export const getDashboardPath = (role?: string | null) => {
  if (!role) return "/"
  return dashboardRoutes[role as AppRole] || "/"
}

export const getPostAuthPath = ({
  role,
  mobile,
}: {
  role?: string | null
  mobile?: string | null
}) => {
  if (!mobile || !role) {
    return "/complete-profile"
  }

  return getDashboardPath(role)
}
