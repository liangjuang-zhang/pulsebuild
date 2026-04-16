/**
 * WatermelonDB Migration Definitions
 * Simplified for v3 sync enablement
 */
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    // Migration 4 -> 5: Mark timestamp fields as optional
    {
      toVersion: 5,
      steps: [
        // WatermelonDB doesn't support altering column constraints directly
        // But marking isOptional in schema allows null values on new records
        // Existing records with epoch (0) will be treated as null in code
        {
          type: 'sql',
          sql: `
            -- Convert epoch (0) values to NULL for onboarding_completed_at
            UPDATE user SET onboarding_completed_at = NULL WHERE onboarding_completed_at = 0;
            UPDATE user SET deleted_at = NULL WHERE deleted_at = 0;
            UPDATE user SET last_login_at = NULL WHERE last_login_at = 0;
          `,
        },
      ],
    },
    // Migration 3 -> 4: Add notifications_enabled field
    {
      toVersion: 4,
      steps: [
        {
          type: 'add_columns',
          table: 'user',
          columns: [
            { name: 'notifications_enabled', type: 'boolean' },
          ],
        },
        // Set default value for existing records
        {
          type: 'sql',
          sql: `
            -- Set default notifications_enabled for existing user
            UPDATE user SET notifications_enabled = 0 WHERE notifications_enabled IS NULL;
          `,
        },
      ],
    },
    // Migration 2 -> 3: Add sync fields (last_modified, email_verified, etc.)
    {
      toVersion: 3,
      steps: [
        // Add sync tracking field using add_columns (plural)
        {
          type: 'add_columns',
          table: 'user',
          columns: [
            { name: 'last_modified', type: 'number', isIndexed: true },
            { name: 'email_verified', type: 'boolean' },
            { name: 'phone_number_verified', type: 'boolean' },
            { name: 'status', type: 'string' },
          ],
        },
        // Use SQL for field renames and data migration
        {
          type: 'sql',
          sql: `
            -- Rename phone to phone_number
            ALTER TABLE user RENAME COLUMN phone TO phone_number;

            -- Rename avatar_url to image
            ALTER TABLE user RENAME COLUMN avatar_url TO image;

            -- Set default status for existing records
            UPDATE user SET status = 'active' WHERE status IS NULL;

            -- Set default last_modified
            UPDATE user SET last_modified = strftime('%s', 'now') * 1000 WHERE last_modified IS NULL;
          `,
        },
        // Add sync fields to projects
        {
          type: 'add_columns',
          table: 'projects',
          columns: [
            { name: 'last_modified', type: 'number', isIndexed: true },
          ],
        },
        // Add sync fields to tasks
        {
          type: 'add_columns',
          table: 'tasks',
          columns: [
            { name: 'last_modified', type: 'number', isIndexed: true },
          ],
        },
      ],
    },
  ],
});