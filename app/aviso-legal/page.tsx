import type { Metadata } from "next";
import { VERSION_AVISO_LEGAL } from "@/lib/legal";
export const metadata: Metadata = {
  title: "Aviso legal y privacidad",
  description: "Información legal, privacidad y tratamiento de datos de Particulares Directo.",
  alternates: { canonical: "/aviso-legal" },
};

export default function AvisoLegalPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 md:px-8 py-10">
      <h1 className="font-serif text-2xl mb-6">Aviso legal y privacidad</h1>
      <p className="-mt-4 mb-6 text-xs text-stone-500">
        Versión vigente: {VERSION_AVISO_LEGAL.split("-").reverse().join("/")}
      </p>

      <div className="space-y-5 text-sm text-stone-600 leading-relaxed">
        <section>
          <h2 className="font-medium text-stone-900 mb-1">¿Qué es Particulares Directo?</h2>
          <p>
            Particulares Directo es una plataforma de anuncios clasificados entre particulares,
            sin intermediarios, centrada actualmente en vivienda y empleo.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">Responsable del tratamiento</h2>
          <p>
            Abaco Salud SL, con NIF B91891382 y domicilio en Calle Fontaneros 2, 41015 Sevilla, es
            la responsable del tratamiento de los datos personales recogidos en esta web. Puedes
            contactarnos para cualquier asunto relacionado con tus datos en{" "}
            <a href="mailto:nuriabarbero@icloud.com" className="underline hover:text-stone-900">
              nuriabarbero@icloud.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">Qué datos recogemos</h2>
          <p>
            Al crear una cuenta pedimos tu nombre, correo electrónico y número de teléfono. Al
            publicar un anuncio, los datos de contacto que decidas incluir (nombre, teléfono o correo) se
            muestran junto al anuncio para que otras personas puedan ponerse en contacto contigo.
            Si subes fotos a un anuncio, se almacenan para mostrarlas en ese anuncio. Para limitar
            el spam y los abusos se generan identificadores técnicos seudonimizados, sin guardar la
            dirección IP en claro en los nuevos registros de contacto.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">Para qué se usan y con qué base legal</h2>
          <p>
            Usamos tus datos para: crear y gestionar tu cuenta y tus anuncios, y permitir que otros
            usuarios te contacten sobre un anuncio (ejecución del contrato de uso del servicio que
            aceptas al registrarte); enviarte avisos sobre tus propios anuncios y, si las activas,
            alertas de nuevos anuncios que coincidan con una búsqueda guardada (consentimiento);
            y prevenir usos fraudulentos del servicio (interés legítimo). No vendemos ni cedemos
            tus datos a terceros con fines comerciales.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">Con quién se comparten</h2>
          <p>
            Para poder ofrecer el servicio, algunos datos se tratan a través de estos proveedores,
            como encargados del tratamiento:
          </p>
          <ul className="list-disc pl-5 mt-1.5 space-y-1">
            <li><strong>Supabase</strong> (base de datos, autenticación y almacenamiento de fotos).</li>
            <li><strong>Vercel</strong> (alojamiento de la web).</li>
            <li><strong>Resend</strong> (envío de correos de la plataforma: confirmación de cuenta, avisos, alertas).</li>
          </ul>
          <p className="mt-1.5">
            Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo;
            en ese caso, lo hacen bajo garantías reconocidas por la normativa europea (como las
            cláusulas contractuales tipo de la Comisión Europea).
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">Cuánto tiempo se conservan</h2>
          <p>
            Los datos operativos se conservan mientras tu cuenta esté activa. Si la eliminas, se
            retiran de la base de datos activa junto con tus anuncios y fotografías. Las copias de
            seguridad privadas pueden conservar esos datos durante un máximo de 14 días, solo para
            recuperar el servicio ante una incidencia, y después se eliminan automáticamente. Los
            registros técnicos usados para limitar abusos se eliminan como máximo en 24 horas. Esto
            se entiende sin perjuicio de la información que deba bloquearse o conservarse durante
            los plazos exigidos por una obligación legal o para atender posibles responsabilidades.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">Tus derechos</h2>
          <p>
            Tienes derecho a acceder a tus datos, rectificarlos, suprimirlos, oponerte a su
            tratamiento, solicitar su limitación y pedir su portabilidad. Puedes ejercerlos
            directamente desde "Mis anuncios" (editar o eliminar anuncios, o eliminar tu cuenta por
            completo) o escribiendo a{" "}
            <a href="mailto:nuriabarbero@icloud.com" className="underline hover:text-stone-900">
              nuriabarbero@icloud.com
            </a>
            . También tienes derecho a presentar una reclamación ante la Agencia Española de
            Protección de Datos (
            <a
              href="https://www.aepd.es"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-stone-900"
            >
              www.aepd.es
            </a>
            ) si consideras que no hemos tratado tus datos correctamente.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">Buzón de sugerencias</h2>
          <p>
            El formulario de contacto/sugerencias es anónimo: no se solicita ni se guarda tu
            nombre ni tu correo al enviarlo. Para impedir envíos automatizados repetidos se conserva
            durante un máximo de 24 horas un identificador irreversible generado a partir de la IP.
            No lo uses para ejercer tus derechos sobre tus datos, ya que al ser anónimo no podemos
            identificarte para atenderlo — escríbenos por email para eso.
          </p>
        </section>

        <section id="cookies-analitica" className="scroll-mt-24">
          <h2 className="font-medium text-stone-900 mb-1">Cookies y analítica</h2>
          <p>
            Usamos almacenamiento técnico necesario para mantener tu sesión iniciada, proteger el
            servicio y recordar tus preferencias de privacidad. También usamos Vercel Analytics
            para obtener estadísticas agregadas de uso sin cookies de terceros ni identificadores
            persistentes.
          </p>
          <p className="mt-2">
            Solo si das tu consentimiento, activamos Google Analytics 4, prestado por Google
            Ireland Limited, para conocer de forma estadística qué páginas se visitan, desde qué
            tipo de dispositivo o navegador y el país aproximado de acceso. Google Analytics puede
            crear las cookies <strong>_ga</strong> y <strong>_ga_*</strong>, con una duración
            máxima habitual de dos años. No activamos mediante este aviso finalidades publicitarias
            ni personalización de anuncios.
          </p>
          <p className="mt-2">
            Puedes aceptar, rechazar o configurar la analítica desde el aviso inicial y cambiar tu
            decisión en cualquier momento mediante “Configurar cookies”, en el pie de página. Al
            retirar el consentimiento dejamos de cargar Google Analytics y eliminamos las cookies
            de analítica accesibles desde esta web.
          </p>
          <p className="mt-2">
            Puedes consultar más información sobre el tratamiento realizado por Google en su{" "}
            <a
              href="https://policies.google.com/privacy?hl=es"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-stone-900"
            >
              política de privacidad
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
