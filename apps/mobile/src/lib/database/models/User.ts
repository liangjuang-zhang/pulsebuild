/**
 * User Model - WatermelonDB Model aligned with backend auth.schema.ts
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

export class User extends Model {
  static table = 'user';

  // Relations - use as const for proper type inference
  static associations = {
    projects: { type: 'has_many' as const, foreignKey: 'owner_id' },
  };

  // Better Auth core fields (aligned with backend)
  @field('name') name!: string;
  @field('email') email!: string;
  @field('email_verified') emailVerified!: boolean;
  @field('image') image!: string | null;
  @field('phone_number') phoneNumber!: string | null;
  @field('phone_number_verified') phoneNumberVerified!: boolean;

  // Extended fields (aligned with backend)
  @field('country_code') countryCode!: string | null;
  @field('timezone') timezone!: string | null;
  @field('job_title') jobTitle!: string | null;
  @field('company_name') companyName!: string | null;
  @field('status') status!: string;
  @field('notifications_enabled') notificationsEnabled!: boolean;

  // Sync tracking field (CRITICAL for WatermelonDB sync)
  @field('last_modified') lastModified!: number | null;

  // Timestamps
  @date('deleted_at') deletedAt!: Date | null;
  @date('last_login_at') lastLoginAt!: Date | null;
  @date('onboarding_completed_at') onboardingCompletedAt!: Date | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Relations
  @relation('projects', 'id') projects!: Project[];

  // Computed properties
  get isActive(): boolean {
    return this.status === 'active' && this.deletedAt === null;
  }

  get hasCompletedOnboarding(): boolean {
    return this.onboardingCompletedAt !== null;
  }
}