import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de uso de Particulares Directo.",
  alternates: { canonical: "/terminos" },
};

export default function TerminosPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 md:px-8 py-10">
      <h1 className="font-serif text-2xl mb-6">Términos y condiciones de uso</h1>

      <div className="space-y-5 text-sm text-stone-600 leading-relaxed">
        <section>
          <h2 className="font-medium text-stone-900 mb-1">1. Objeto</h2>
          <p>
            Estas condiciones regulan el uso de Particulares Directo, una plataforma operada por
            Abaco Salud SL (NIF B91891382) que permite a particulares publicar y consultar
            anuncios clasificados directamente entre ellos, sin intermediarios. Al usar la web
            aceptas estas condiciones; si no estás de acuerdo, no debes usar el servicio.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">2. Quién puede usarlo</h2>
          <p>
            Debes ser mayor de edad y proporcionar datos veraces al crear tu cuenta. Eres
            responsable de mantener la confidencialidad de tu contraseña y de toda actividad
            realizada desde tu cuenta.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">3. Somos solo un intermediario tecnológico</h2>
          <p>
            Particulares Directo únicamente ofrece el espacio para que los usuarios publiquen y
            encuentren anuncios entre sí. No somos parte de las transacciones, acuerdos o
            comunicaciones entre usuarios, ni verificamos la identidad de quienes publican, ni la
            veracidad, legalidad, calidad o estado de lo anunciado. Cualquier acuerdo (compraventa,
            alquiler, contratación...) se realiza directamente entre los usuarios implicados, bajo
            su exclusiva responsabilidad.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">4. Normas de los anuncios</h2>
          <p>Al publicar un anuncio, te comprometes a que:</p>
          <ul className="list-disc pl-5 mt-1.5 space-y-1">
            <li>La información sea veraz y el anuncio corresponda a algo real que ofreces o buscas.</li>
            <li>No publiques contenido ilegal, fraudulento, engañoso, difamatorio o que infrinja derechos de terceros (incluida la propiedad intelectual).</li>
            <li>No publiques datos de contacto ni información personal de otras personas sin su consentimiento.</li>
            <li>No uses la plataforma para spam, phishing, estafas o actividades comerciales encubiertas como particulares cuando no lo sean.</li>
            <li>Las fotos que subas sean tuyas o tengas derecho a usarlas.</li>
          </ul>
          <p className="mt-1.5">
            Podemos eliminar, sin previo aviso, cualquier anuncio o cuenta que incumpla estas
            normas o la ley aplicable.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">5. Publicación y anuncios destacados</h2>
          <p>
            Actualmente, publicar, renovar y destacar anuncios es gratuito, sujeto a los límites
            de uso indicados en la propia web. No se realizará ningún cargo por estas acciones.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">6. Caducidad de los anuncios</h2>
          <p>
            Los anuncios se desactivan automáticamente a los 30 días de su publicación si no se
            renuevan. Puedes reactivarlos cuando quieras desde "Mis anuncios".
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">7. Propiedad de la plataforma</h2>
          <p>
            El nombre, diseño, marca y código de Particulares Directo son propiedad de Abaco Salud
            SL. El contenido de cada anuncio (textos, fotos) sigue siendo propiedad de quien lo
            publica.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">8. Limitación de responsabilidad</h2>
          <p>
            Ofrecemos el servicio "tal cual", sin garantizar que esté libre de errores o
            interrupciones. No respondemos de los daños derivados del uso del servicio ni de las
            interacciones o transacciones entre usuarios, dentro de los límites que permita la ley.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">9. Cambios en estas condiciones</h2>
          <p>
            Podemos actualizar estos términos cuando sea necesario; los cambios importantes se
            reflejarán en esta misma página.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">10. Legislación y contacto</h2>
          <p>
            Estas condiciones se rigen por la legislación española. Si eres consumidor, puedes
            acudir a los tribunales que te correspondan según la normativa de protección de
            consumidores. Para cualquier duda, escríbenos a{" "}
            <a href="mailto:nuriabarbero@icloud.com" className="underline hover:text-stone-900">
              nuriabarbero@icloud.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
