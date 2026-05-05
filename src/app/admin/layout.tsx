import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/admin/SignOutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-[#0f0b05] text-[#f5e8c8]">
      <nav className="border-b border-[rgba(212,168,80,0.12)] bg-[#1a1006]">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-[#d4a850] font-semibold text-sm tracking-wide">
              📖 Quiz Admin
            </span>
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-[rgba(245,232,200,0.5)] hover:text-[#f5e8c8] text-sm transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/leads"
                className="text-[rgba(245,232,200,0.5)] hover:text-[#f5e8c8] text-sm transition-colors"
              >
                Leads
              </Link>
            </div>
          </div>
          <SignOutButton />
        </div>
      </nav>
      <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8">{children}</main>
    </div>
  );
}
