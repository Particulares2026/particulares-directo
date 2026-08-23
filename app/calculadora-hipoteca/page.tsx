import Link from "next/link";
import CalculadoraHipoteca from "@/components/CalculadoraHipoteca";

export const metadata = {
  title: "Calculadora de hipoteca - Particulares Directo",
  description: "Calcula la cuota mensual estimada de una hipoteca según el precio, la entrada, el plazo y el interés.",
};

export default async function CalculadoraHipotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ precio?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const precioInicial = resolvedSearchParams.precio ? Number(resolvedSearchParams.precio) : null;

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <Link href="/categoria/inmobiliaria" className="text-sm text-stone-500 hover:text-stone-700">
        ← Inmobiliaria
      </Link>
      <h1 className="font-serif text-2xl mt-2 mb-1">🏦 Calculadora de hipoteca</h1>
      <p className="text-sm text-stone-500 mb-6">
        Estima la cuota mensual y el coste total de tu financiación.
      </p>
      <CalculadoraHipoteca precioInicial={precioInicial} />
    </main>
  );
}
