import { Migration } from "@mikro-orm/migrations"

export class Migration20260527090000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "sushi_delivery_settings" ("id" text not null, "origin_address" text not null default '', "price_per_mile" real not null default 2, "max_radius_miles" real not null default 15, "allowed_days" jsonb not null default '[]', "allowed_time_windows" jsonb null, "enable_pickup" boolean not null default true, "enable_delivery" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "sushi_delivery_settings_pkey" primary key ("id"));`,
    )
    this.addSql(
      `create table if not exists "sushi_order_request" ("id" text not null, "status" text check ("status" in ('pending_confirmation', 'confirmed', 'rejected', 'cancelled')) not null default 'pending_confirmation', "customer_email" text not null, "customer_name" text null, "customer_phone" text null, "fulfillment_type" text check ("fulfillment_type" in ('pickup', 'delivery')) not null default 'delivery', "scheduled_at" timestamptz not null, "delivery_address" text null, "delivery_miles" real null, "delivery_fee_cents" integer null, "cart_snapshot" jsonb not null, "notes" text null, "rejection_reason" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "sushi_order_request_pkey" primary key ("id"));`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "sushi_order_request" cascade;`)
    this.addSql(`drop table if exists "sushi_delivery_settings" cascade;`)
  }
}
