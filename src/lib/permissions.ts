export type Permission =
  | 'view_sales'
  | 'create_sale'
  | 'cancel_sale'
  | 'view_stock'
  | 'modify_stock'
  | 'view_articles'
  | 'create_article'
  | 'edit_article'
  | 'delete_article'
  | 'modify_prices'
  | 'view_clients'
  | 'manage_clients'
  | 'view_suppliers'
  | 'manage_suppliers'
  | 'view_expenses'
  | 'create_expense'
  | 'view_finances'
  | 'export_data'
  | 'manage_users'
  | 'view_audit_log';

export const rolePermissions: Record<string, Permission[]> = {
  admin: [
    'view_sales',
    'create_sale',
    'cancel_sale',
    'view_stock',
    'modify_stock',
    'view_articles',
    'create_article',
    'edit_article',
    'delete_article',
    'modify_prices',
    'view_clients',
    'manage_clients',
    'view_suppliers',
    'manage_suppliers',
    'view_expenses',
    'create_expense',
    'view_finances',
    'export_data',
    'manage_users',
    'view_audit_log',
  ],
  manager: [
    'view_sales',
    'create_sale',
    'cancel_sale',
    'view_stock',
    'modify_stock',
    'view_articles',
    'create_article',
    'edit_article',
    'modify_prices',
    'view_clients',
    'manage_clients',
    'view_suppliers',
    'manage_suppliers',
    'view_expenses',
    'create_expense',
    'view_finances',
    'export_data',
    'view_audit_log',
  ],
  cashier: [
    'view_sales',
    'create_sale',
    'view_stock',
    'view_articles',
    'view_clients',
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

export function checkMultiplePermissions(
  role: string,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}
