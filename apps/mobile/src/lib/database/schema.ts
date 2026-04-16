/**
 * WatermelonDB Schema Definition
 * Aligned with backend Drizzle ORM schema + WatermelonDB Sync requirements
 *
 * Sync fields (_status, _changed) are automatically added by WatermelonDB
 * when using synchronize() function
 */
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 5, // Upgraded for optional timestamp fields
  tables: [
    // Users table - synced with backend user table
    tableSchema({
      name: 'user',
      columns: [
        // Better Auth core fields (aligned with backend auth.schema.ts)
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string', isIndexed: true },
        { name: 'email_verified', type: 'boolean' },
        { name: 'image', type: 'string' }, // Avatar URL (profile photo)
        { name: 'phone_number', type: 'string', isIndexed: true },
        { name: 'phone_number_verified', type: 'boolean' },

        // Extended fields (aligned with backend)
        { name: 'country_code', type: 'string' },
        { name: 'timezone', type: 'string' },
        { name: 'job_title', type: 'string' },
        { name: 'company_name', type: 'string' },
        { name: 'status', type: 'string' }, // active/inactive
        { name: 'notifications_enabled', type: 'boolean' }, // Push notifications setting

        // Sync tracking fields (CRITICAL for WatermelonDB sync)
        { name: 'last_modified', type: 'number', isIndexed: true }, // Server timestamp

        // Timestamps
        { name: 'deleted_at', type: 'number', isOptional: true }, // Soft delete
        { name: 'last_login_at', type: 'number', isOptional: true },
        { name: 'onboarding_completed_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    // Projects table (for future sync)
    tableSchema({
      name: 'projects',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'address', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'owner_id', type: 'string', isIndexed: true },
        { name: 'last_modified', type: 'number', isIndexed: true },
        { name: 'deleted_at', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    // Tasks table (for future sync)
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'assigned_to', type: 'string', isIndexed: true },
        { name: 'created_by', type: 'string' },
        { name: 'due_date', type: 'number' },
        { name: 'last_modified', type: 'number', isIndexed: true },
        { name: 'deleted_at', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});