import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { perfectpaySales, users } from "@/db/schema";
import { eq } from "drizzle-orm";

const bodySchema = z.object({
  token: z.string().min(1),
  code: z.string().min(1),
  sale_amount: z.number(),
  currency_enum: z.number().int(),
  sale_status_enum: z.number().int(),
  date_created: z.string(),
  date_approved: z.string().nullable().optional(),
  product: z.object({
    code: z.string(),
    name: z.string(),
  }),
  plan: z.object({
    code: z.string(),
    name: z.string(),
  }),
  customer: z.object({
    full_name: z.string(),
    email: z.string().email(),
  }),
});

function verifyToken(incoming: string): boolean {
  const expected = process.env.PERFECTPAY_WEBHOOK_TOKEN ?? "";
  if (!expected) return false;
  try {
    return timingSafeEqual(Buffer.from(incoming), Buffer.from(expected));
  } catch {
    return false;
  }
}

// Status na PerfectPay: 0=checkout_saved, 1=waiting_payment, 2=refused, 3=approved, 4=refunded, 5=chargeback
const APPROVED_STATUSES = new Set([3]);

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const data = parsed.data;

  if (!verifyToken(data.token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Gravar venda (idempotente)
  await db
    .insert(perfectpaySales)
    .values({
      token: data.token,
      code: data.code,
      saleAmount: data.sale_amount,
      currencyEnum: data.currency_enum,
      saleStatusEnum: data.sale_status_enum,
      dateCreated: new Date(data.date_created),
      dateApproved: data.date_approved ? new Date(data.date_approved) : null,
      productCode: data.product.code,
      productName: data.product.name,
      planCode: data.plan.code,
      planName: data.plan.name,
      customerFullName: data.customer.full_name,
      customerEmail: data.customer.email,
    })
    .onConflictDoNothing({ target: perfectpaySales.code });

  // Criar usuário apenas para vendas aprovadas
  if (APPROVED_STATUSES.has(data.sale_status_enum)) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.customer.email))
      .limit(1);

    if (!existing) {
      const defaultPassword =
        process.env.PERFECTPAY_DEFAULT_PASSWORD ?? "Biblia360alterar";
      const hash = await bcrypt.hash(defaultPassword, 12);
      await db.insert(users).values({
        email: data.customer.email,
        passwordHash: hash,
      });
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
