export default function AvisoLegalPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 md:px-8 py-10">
      <h1 className="font-serif text-2xl mb-6">Aviso legal y privacidad</h1>

      <div className="space-y-5 text-sm text-stone-600 leading-relaxed">
        <section>
          <h2 className="font-medium text-stone-900 mb-1">¿Qué es Particulares Directo?</h2>
          <p>
            Particulares Directo es una plataforma de anuncios clasificados entre particulares,
            sin intermediarios, en distintas categorías (inmobiliaria, trabajo, coches, moda,
            muebles y hogar, mascotas, tecnología y deporte).
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">Qué datos recogemos</h2>
          <p>
            Al crear una cuenta pedimos tu nombre, correo electrónico y número de teléfono. Al
            publicar un anuncio, los datos de contacto que decidas incluir (nombre y teléfono) se
            muestran junto al anuncio para que otras personas puedan ponerse en contacto contigo.
            Si subes fotos a un anuncio, se almacenan para mostrarlas en ese anuncio.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">Para qué se usan</h2>
          <p>
            Únicamente para el funcionamiento del servicio: crear tu cuenta, publicar y gestionar
            tus anuncios, y permitir que otros usuarios te contacten sobre un anuncio. No vendemos
            ni cedemos tus datos a terceros con fines comerciales.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">Buzón de sugerencias</h2>
          <p>
            El formulario de contacto/sugerencias es anónimo: no se solicita ni se guarda tu
            nombre ni tu correo al enviarlo.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">Tus derechos</h2>
          <p>
            Puedes editar o eliminar tus anuncios en cualquier momento desde "Mis anuncios", y
            eliminar tu cuenta por completo desde esa misma página. Si tienes cualquier duda sobre
            tus datos, puedes escribirnos a través del buzón de sugerencias.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-stone-900 mb-1">Cookies</h2>
          <p>
            Usamos únicamente cookies técnicas necesarias para mantener tu sesión iniciada. No
            utilizamos cookies de publicidad ni de seguimiento.
          </p>
        </section>
      </div>
    </main>
  );
}
