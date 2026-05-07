CREATE TABLE "perfectpay_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"code" text NOT NULL,
	"sale_amount" integer NOT NULL,
	"currency_enum" smallint NOT NULL,
	"sale_status_enum" smallint NOT NULL,
	"date_created" timestamp NOT NULL,
	"date_approved" timestamp,
	"product_code" text NOT NULL,
	"product_name" text NOT NULL,
	"plan_code" text NOT NULL,
	"plan_name" text NOT NULL,
	"customer_full_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "perfectpay_sales_code_unique" UNIQUE("code")
);
