/**
 * WatermelonDB Database Module
 * Exports all database-related functionality including sync
 */

// Database initialization
export { database, initializeDatabase, getDatabase, resetDatabase, isDatabaseInitialized } from './database';

// Schema
export { schema } from './schema';

// Migrations
export { migrations } from './migrations';

// Models
export { User, Project, Task } from './models';

// Sync (official WatermelonDB sync)
export { syncManager, syncDatabase, checkNeedsSync, getLastSyncTimestamp } from './sync-manager';