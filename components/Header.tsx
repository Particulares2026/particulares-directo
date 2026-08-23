import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { esAdmin } from "@/lib/admin";
import HeaderNav from "./HeaderNav";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="relative z-30 flex items-center justify-between border-b-2 border-fuchsia-100 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
      <Link href="/" aria-label="Ir a la portada" className="flex min-w-0 items-center gap-2 sm:gap-3">
        <svg
          viewBox="0 0 100 100"
          className="h-10 w-10 shrink-0 sm:h-14 sm:w-14"
          aria-hidden="true"
        >
          <rect x="0" y="0" width="100" height="100" rx="20" fill="#ec1178" />
          <text
            x="7"
            y="83"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="800"
            fontSize="100"
            fill="#ffffff"
          >
            P
          </text>
          <text
            x="55"
            y="94"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="800"
            fontSize="50"
            fill="#ffffff"
          >
            D
          </text>
        </svg>
        <span className="truncate font-sans text-lg font-bold tracking-tight sm:text-2xl">
          Particulares Directo
        </span>
      </Link>
      <HeaderNav
        authenticated={Boolean(user)}
        email={user?.email ?? null}
        admin={Boolean(user && esAdmin(user.email))}
      />
    </header>
  );
}
