/**
 * Project Model - WatermelonDB Model for projects
 * Supports official WatermelonDB Sync
 */
import { Model } from '@nozbe/watermelondb';
import {
  field,
  date,
  readonly,
  relation,
  writer,
} from '@nozbe/watermelondb/decorators';

import type { User } from './User';
import type { Task } from './Task';

export class Project extends Model {
  static table = 'projects';

  // Relations - use as const for proper type inference
  static associations = {
    user: { type: 'belongs_to' as const, key: 'owner_id' },
    tasks: { type: 'has_many' as const, foreignKey: 'project_id' },
  };

  // Fields
  @field('name') name!: string;
  @field('address') address!: string | null;
  @field('status') status!: string;
  @field('owner_id') ownerId!: string;

  // Sync tracking field
  @field('last_modified') lastModified!: number | null;

  // Timestamps
  @date('deleted_at') deletedAt!: Date | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Relations
  @relation('user', 'owner_id') owner!: User;
  @relation('tasks', 'project_id') tasks!: Task[];

  // Actions
  @writer async updateDetails(updates: Partial<{
    name: string;
    address: string;
    status: string;
  }>): Promise<void> {
    const now = new Date();
    await this.update({
      ...updates,
      updatedAt: now,
    } as any);
  }

  @writer async softDelete(): Promise<void> {
    const now = new Date();
    await this.update({
      deletedAt: now,
      updatedAt: now,
    } as any);
  }
}