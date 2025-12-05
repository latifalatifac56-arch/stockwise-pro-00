import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Article {
  id?: number;
  sku: string;
  name: string;
  description?: string;
  category: string;
  type: string;
  image?: string;
  barcode?: string;
  buyPrice: number;
  sellPrice: number;
  wholesalePrice?: number;
  unit: string;
  stock: number;
  minStock: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id?: number;
  invoiceNumber: string;
  clientId?: number;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'tmoney' | 'flooz' | 'card' | 'credit';
  status: 'completed' | 'suspended' | 'cancelled';
  createdBy: number;
  createdAt: string;
}

export interface SaleItem {
  articleId: number;
  name: string;
  quantity: number;
  price: number;
  buyPrice: number;
  profit: number;
  total: number;
}

export interface Client {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  country?: string;
  type: 'regular' | 'vip';
  creditLimit: number;
  balance: number;
  createdAt: string;
}

export interface Supplier {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  country?: string;
  paymentTerms?: string;
  balance: number;
  status: 'active' | 'blacklisted';
  createdAt: string;
}

export interface Expense {
  id?: number;
  category: string;
  amount: number;
  description: string;
  receipt?: string;
  date: string;
  createdBy: number;
  createdAt: string;
}

export interface Settings {
  id?: number;
  companyName: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  language: string;
  receiptFooter?: string;
  taxRate: number;
}

export interface User {
  id?: number;
  username: string;
  password: string;
  pin?: string;
  role: 'admin' | 'cashier' | 'manager';
  fullName: string;
  email?: string;
  status: 'active' | 'inactive';
  lastActivity?: string;
  createdAt: string;
}

export interface AuditLog {
  id?: number;
  userId: number;
  username: string;
  action: string;
  entity: string;
  entityId?: number;
  details?: string;
  timestamp: string;
}

interface StockManagementDB extends DBSchema {
  articles: {
    key: number;
    value: Article;
    indexes: { 'by-sku': string; 'by-category': string };
  };
  sales: {
    key: number;
    value: Sale;
    indexes: { 'by-date': string; 'by-invoice': string };
  };
  clients: {
    key: number;
    value: Client;
  };
  suppliers: {
    key: number;
    value: Supplier;
  };
  expenses: {
    key: number;
    value: Expense;
    indexes: { 'by-date': string };
  };
  settings: {
    key: number;
    value: Settings;
  };
  users: {
    key: number;
    value: User;
    indexes: { 'by-username': string };
  };
  auditLogs: {
    key: number;
    value: AuditLog;
    indexes: { 'by-timestamp': string; 'by-entity': string };
  };
}

let db: IDBPDatabase<StockManagementDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<StockManagementDB>> {
  if (db) return db;

  db = await openDB<StockManagementDB>('stock-management', 2, {
    upgrade(db, oldVersion) {
      // Articles store
      if (!db.objectStoreNames.contains('articles')) {
        const articleStore = db.createObjectStore('articles', {
          keyPath: 'id',
          autoIncrement: true,
        });
        articleStore.createIndex('by-sku', 'sku', { unique: true });
        articleStore.createIndex('by-category', 'category');
      }

      // Sales store
      if (!db.objectStoreNames.contains('sales')) {
        const salesStore = db.createObjectStore('sales', {
          keyPath: 'id',
          autoIncrement: true,
        });
        salesStore.createIndex('by-date', 'createdAt');
        salesStore.createIndex('by-invoice', 'invoiceNumber', { unique: true });
      }

      // Clients store
      if (!db.objectStoreNames.contains('clients')) {
        db.createObjectStore('clients', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }

      // Suppliers store
      if (!db.objectStoreNames.contains('suppliers')) {
        db.createObjectStore('suppliers', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }

      // Expenses store
      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', {
          keyPath: 'id',
          autoIncrement: true,
        });
        expenseStore.createIndex('by-date', 'date');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }

      // Users store
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', {
          keyPath: 'id',
          autoIncrement: true,
        });
        userStore.createIndex('by-username', 'username', { unique: true });
      }

      // Audit logs store (added in version 2)
      if (oldVersion < 2 && !db.objectStoreNames.contains('auditLogs')) {
        const auditStore = db.createObjectStore('auditLogs', {
          keyPath: 'id',
          autoIncrement: true,
        });
        auditStore.createIndex('by-timestamp', 'timestamp');
        auditStore.createIndex('by-entity', 'entity');
      }
    },
  });

  // Initialize default settings if not exists
  const settings = await db.getAll('settings');
  if (settings.length === 0) {
    await db.add('settings', {
      companyName: 'Mon Entreprise',
      primaryColor: '#3b82f6',
      secondaryColor: '#10b981',
      currency: 'FCFA',
      language: 'fr',
      taxRate: 18,
    });
  }

  // Initialize default admin user if not exists
  const users = await db.getAll('users');
  if (users.length === 0) {
    await db.add('users', {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      fullName: 'Administrateur',
      status: 'active',
      createdAt: new Date().toISOString(),
    });
  }

  return db;
}

export async function getDB(): Promise<IDBPDatabase<StockManagementDB>> {
  if (!db) {
    return await initDB();
  }
  return db;
}
