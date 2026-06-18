import { Migration } from "@mikro-orm/migrations"

export class Migration20260531120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "sushi_delivery_settings" add column if not exists "pickup_address" text not null default '';`,
    )
    this.addSql(
      `alter table "sushi_delivery_settings" add column if not exists "store_timezone" text not null default 'America/Chicago';`,
    )

    this.addSql(
      `alter table "sushi_order_request" add column if not exists "subtotal_cents" integer null;`,
    )
    this.addSql(
      `alter table "sushi_order_request" add column if not exists "payment_cart_id" text null;`,
    )
    this.addSql(
      `alter table "sushi_order_request" add column if not exists "order_id" text null;`,
    )
    this.addSql(
      `alter table "sushi_order_request" add column if not exists "accepted_at" timestamptz null;`,
    )
    this.addSql(
      `alter table "sushi_order_request" add column if not exists "reservation_ids" jsonb null;`,
    )

    this.addSql(
      `alter table "sushi_order_request" drop constraint if exists "sushi_order_request_status_check";`,
    )
    this.addSql(
      `alter table "sushi_order_request" add constraint "sushi_order_request_status_check" check ("status" in ('pending_confirmation', 'confirmed', 'rejected', 'cancelled', 'paid', 'expired'));`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "sushi_order_request" drop constraint if exists "sushi_order_request_status_check";`,
    )
    this.addSql(
      `alter table "sushi_order_request" add constraint "sushi_order_request_status_check" check ("status" in ('pending_confirmation', 'confirmed', 'rejected', 'cancelled'));`,
    )

    this.addSql(
      `alter table "sushi_order_request" drop column if exists "reservation_ids";`,
    )
    this.addSql(
      `alter table "sushi_order_request" drop column if exists "accepted_at";`,
    )
    this.addSql(
      `alter table "sushi_order_request" drop column if exists "order_id";`,
    )
    this.addSql(
      `alter table "sushi_order_request" drop column if exists "payment_cart_id";`,
    )
    this.addSql(
      `alter table "sushi_order_request" drop column if exists "subtotal_cents";`,
    )

    this.addSql(
      `alter table "sushi_delivery_settings" drop column if exists "store_timezone";`,
    )
    this.addSql(
      `alter table "sushi_delivery_settings" drop column if exists "pickup_address";`,
    )
  }
}
