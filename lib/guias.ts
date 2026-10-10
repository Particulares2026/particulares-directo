export type Guia = { slug: string; titulo: string; descripcion: string; intro: string; secciones: { titulo: string; parrafos: string[]; plantilla?: string }[]; enlaces: {texto: string; href: string}[]; fuente?: {texto: string; href: string} };
export const GUIAS: Guia[] = [
  {
    "slug": "plantilla-anuncio-vivienda",
    "titulo": "Cómo publicar un anuncio de vivienda completo",
    "descripcion": "Plantilla para describir una vivienda en venta o alquiler: ubicación, superficie, precio, distribución, fotos y contacto protegido.",
    "intro": "Un anuncio completo ayuda a que quien lo lea sepa si la vivienda encaja antes de contactar. Describe lo que puedes comprobar y mantén los datos coherentes entre el formulario y el texto.",
    "secciones": [
      {
        "titulo": "Prepara los datos y las fotos",
        "parrafos": [
          "Distingue venta y alquiler, indica municipio y zona, tipo de inmueble y superficie. Aclara si los metros son útiles o construidos, sin deducirlos de las fotografías.",
          "Añade habitaciones, baños, planta y ascensor, si los conoces. En alquiler, especifica periodo del importe, duración prevista y gastos incluidos. Usa fotos actuales que tengas permiso para publicar; evita documentos, caras y objetos que revelen datos privados."
        ]
      },
      {
        "titulo": "Plantilla para adaptar",
        "parrafos": [
          "Sustituye los corchetes y elimina los apartados que no correspondan. Este texto describe un anuncio, no constituye un contrato."
        ],
        "plantilla": "Título: [Venta o alquiler] de [tipo] en [municipio o zona]\nSuperficie: [m² y criterio: útiles o construidos]\nDistribución: [habitaciones, baños y estancias]\nEstado: [descripción fiel]\nCaracterísticas: [planta, ascensor, exterior y equipamiento]\nPrecio: [importe; en alquiler, periodo y gastos incluidos]\nDisponibilidad: [fecha o situación]\nVisitas: [cómo acordarlas sin publicar datos privados]\nInformación adicional: [aspectos relevantes que puedas confirmar]\nContacto: usa el botón de contacto del anuncio."
      },
      {
        "titulo": "Publicación y privacidad en Particulares Directo",
        "parrafos": [
          "En el formulario, elige Inmobiliaria y la operación correspondiente. Completa precio y superficie en sus campos, además de explicarlos si hace falta. Revisa la descripción y las fotos antes de publicar.",
          "Pon teléfono y correo en los campos de contacto. No los escribas en el nombre público, título, descripción o fotografías. Evita publicar la dirección exacta si no es necesaria para presentar el inmueble."
        ]
      },
      {
        "titulo": "Comprueba la coherencia y mantenlo actualizado",
        "parrafos": [
          "El precio, la superficie y las características deben coincidir en todos los apartados. Describe también los aspectos que una persona necesitaría conocer antes de concertar una visita.",
          "Si cambian el precio o la disponibilidad, actualiza el anuncio. Consulta las publicaciones de la zona para comparar información, sin interpretar los precios solicitados como ventas ya realizadas."
        ]
      }
    ],
    "enlaces": [
      {
        "texto": "Publicar un anuncio",
        "href": "/publicar"
      },
      {
        "texto": "Ver inmuebles",
        "href": "/categoria/inmobiliaria"
      },
      {
        "texto": "Entender el precio por m²",
        "href": "/precios-m2"
      }
    ]
  },
  {
    "slug": "reconocer-anuncios-sospechosos",
    "titulo": "Cómo reconocer anuncios sospechosos y contactar con cuidado",
    "descripcion": "Señales de alerta en anuncios de vivienda y empleo, comprobaciones antes de pagar o compartir documentos y cómo avisar al portal.",
    "intro": "Una señal aislada no demuestra un fraude. Si se acumulan incoherencias, presión o peticiones de dinero, detén la operación y comprueba los datos antes de seguir.",
    "secciones": [
      {
        "titulo": "Señales que requieren comprobar más",
        "parrafos": [
          "Desconfía de precios llamativamente bajos unidos a urgencia por pagar, excusas continuas para enseñar el inmueble o fotografías que aparecen en anuncios de ubicaciones distintas.",
          "En empleo, presta atención si te piden dinero para acceder al puesto o documentación sensible sin explicar quién la solicita y para qué. No confundas un anuncio publicado con una empresa o propiedad verificada."
        ]
      },
      {
        "titulo": "Antes de pagar o enviar documentos",
        "parrafos": [
          "Comprueba por una vía independiente la identidad de la empresa o de quien ofrece el inmueble y su relación con él. En vivienda, solicita una visita y aclara las condiciones antes de adelantar dinero.",
          "No envíes documentos de identidad a desconocidos por presión. No compartas contraseñas ni códigos de acceso. Si recibes un enlace de pago o de inicio de sesión, comprueba la dirección y accede al servicio desde su web conocida."
        ]
      },
      {
        "titulo": "Cómo avisar en Particulares Directo",
        "parrafos": [
          "Abre el anuncio individual y utiliza «Denunciar este anuncio». Explica el hecho concreto que has observado, como fotos copiadas, una petición de dinero o datos contradictorios.",
          "La revisión del portal no sustituye tus comprobaciones ni una denuncia ante las autoridades. Los acuerdos y las conversaciones con el anunciante requieren la misma cautela aunque el anuncio siga visible."
        ]
      },
      {
        "titulo": "Si ya has enviado dinero o datos",
        "parrafos": [
          "Conserva la dirección del anuncio, mensajes y justificantes. Contacta cuanto antes con tu entidad de pago si has transferido dinero y comunica los hechos a las autoridades.",
          "Si has revelado una contraseña, cámbiala desde el servicio oficial y revisa el acceso a la cuenta. No publiques en una denuncia abierta documentos, cuentas bancarias ni datos de otras personas."
        ]
      }
    ],
    "fuente": {
      "texto": "Recomendaciones de la Policía Nacional sobre ofertas falsas de empleo y alquiler",
      "href": "https://www.interior.gob.es/opencms/eu/detalle/articulo/Interior-alerta-sobre-el-peligro-de-las-ciberestafas-de-falsas-ofertas-de-empleo-y-de-alquiler-barato/"
    },
    "enlaces": [
      {
        "texto": "Ver anuncios",
        "href": "/"
      },
      {
        "texto": "Contacto y responsable del portal",
        "href": "/aviso-legal"
      }
    ]
  }
];

