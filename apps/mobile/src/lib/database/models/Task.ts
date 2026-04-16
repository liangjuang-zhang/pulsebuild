/**
 * Task Model - WatermelonDB Model for tasks
 * Supports official WatermelonDB Sync
 */
import { Model } from '@nozbe/watermelondb';
import {
  field,
  date,
  readonly,
  relation,
} from '@nozbe/watermelondb/decorators';

import type { Project } from './Project';
import type { User } from './User';

export class Task extends Model {
  static table = 'tasks';

  // Relations - use as const for proper type inference
  static associations = {
    projects: { type: 'belongs_to' as const, key: 'project_id' },
    user: { type: 'belongs_to' as const, key: 'assigned_to' },
  };

  // Fields
  @field('project_id') projectId!: string;
  @field('title') title!: string;
  @field('description') description!: string | null;
  @field('status') status!: string;
  @field('assigned_to') assignedTo!: string | null;
  @field('created_by') createdBy!: string | null;
  @date('due_date') dueDate!: Date | null;

  // Sync tracking field
  @field('last_modified') lastModified!: number | null;

  // Timestamps
  @date('deleted_at') deletedAt!: Date | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Relations
  @relation('projects', 'project_id') project!: Project;
  @relation('user', 'assigned_to') assignee!: User | null;
}