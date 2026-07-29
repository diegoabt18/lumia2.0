export interface LegalSection {
  title: string
  paragraphs?: string[]
  bullets?: string[]
  ordered?: string[]
}

export interface LegalPage {
  slug: string
  title: string
  subtitle: string
  sections: LegalSection[]
  updatedAt?: string
}

export const LEGAL_PAGES: Record<string, LegalPage> = {
  terms: {
    slug: 'terms',
    title: 'Términos y Condiciones',
    subtitle: 'Condiciones generales de venta para las compras realizadas en LUMIA.',
    updatedAt: 'julio 2026',
    sections: [
      {
        title: '1. Información general',
        paragraphs: [
          'Los presentes Términos regulan la relación entre LUMIA · Velas y Decoración ("LUMIA") y los clientes que realicen pedidos en esta tienda. Al confirmar un pedido, aceptas estas condiciones.',
        ],
      },
      {
        title: '2. Productos artesanales',
        paragraphs: [
          'Todos los productos LUMIA son elaborados artesanalmente. Pueden existir ligeras variaciones en color, forma o acabado respecto a las imágenes; forman parte del carácter único de cada pieza y no constituyen defecto.',
        ],
      },
      {
        title: '3. Precios y pagos',
        paragraphs: [
          'Los precios se muestran en la moneda indicada en la tienda. Los gastos de envío se acuerdan con el vendedor cuando aplique.',
          'Con pago acordado, el pedido queda en estado "pendiente de confirmación" hasta que el vendedor verifique el pago.',
        ],
        bullets: [
          'Pago acordado con el vendedor (transferencia, efectivo u otro medio acordado por WhatsApp o teléfono).',
          'Mercado Pago (cuando esté habilitado en la tienda).',
        ],
      },
      {
        title: '4. Plazos de preparación',
        bullets: [
          'Productos en stock: envío en 1–3 días hábiles tras confirmar pago.',
          'Productos bajo pedido: fabricación en 5–10 días hábiles.',
          'Pedidos personalizados: plazo acordado con el cliente.',
        ],
      },
      {
        title: '5. Responsabilidad',
        paragraphs: [
          'Las velas deben usarse siguiendo las instrucciones de seguridad. LUMIA no se responsabiliza del uso indebido de los productos.',
        ],
      },
    ],
  },
  privacy: {
    slug: 'privacy',
    title: 'Política de Privacidad',
    subtitle: 'Tratamiento de datos personales conforme a la normativa aplicable.',
    updatedAt: 'julio 2026',
    sections: [
      {
        title: '1. Responsable',
        paragraphs: [
          'Responsable: LUMIA · Velas y Decoración. Para ejercer tus derechos, contacta a través de los canales indicados en la tienda.',
        ],
      },
      {
        title: '2. Datos que recopilamos',
        bullets: [
          'Identificación: nombre, correo, teléfono.',
          'Envío: dirección, ciudad, referencia.',
          'Compra: historial de pedidos y productos (no almacenamos datos bancarios completos).',
          'Cuenta Google: identificador, nombre y correo si inicias sesión con Google.',
        ],
      },
      {
        title: '3. Finalidad',
        bullets: [
          'Gestionar pedidos y comunicaciones sobre su estado.',
          'Autenticación y cuenta de usuario.',
          'Cumplimiento de obligaciones legales.',
        ],
      },
      {
        title: '4. Conservación',
        paragraphs: [
          'Conservamos los datos mientras exista relación comercial o el plazo legal exigido (p. ej. obligaciones fiscales).',
        ],
      },
    ],
  },
  envios: {
    slug: 'envios',
    title: 'Política de Envíos',
    subtitle: 'Plazos, costes y condiciones de entrega.',
    updatedAt: 'julio 2026',
    sections: [
      {
        title: '1. Zonas de envío',
        paragraphs: [
          'Realizamos envíos dentro de Colombia. Para otras zonas, contáctanos para un presupuesto personalizado.',
        ],
      },
      {
        title: '2. Plazos',
        bullets: [
          'Preparación: 1–10 días hábiles según disponibilidad del producto.',
          'Transporte: 2–7 días hábiles adicionales según destino y mensajería.',
        ],
      },
      {
        title: '3. Costes',
        paragraphs: [
          'Los gastos de envío se confirman al coordinar el pedido con el vendedor antes o después del pago acordado.',
        ],
      },
      {
        title: '4. Embalaje y daños',
        paragraphs: [
          'Embalamos con cuidado cada pieza. Si recibes un producto dañado, escríbenos en las 48 horas siguientes con fotos del paquete y del producto.',
        ],
      },
    ],
  },
  devoluciones: {
    slug: 'devoluciones',
    title: 'Devoluciones y Reembolsos',
    subtitle: 'Derecho de desistimiento y condiciones de devolución.',
    updatedAt: 'julio 2026',
    sections: [
      {
        title: '1. Derecho de desistimiento',
        paragraphs: [
          'Dispones de 14 días naturales desde la recepción para solicitar devolución, salvo excepciones legales. Escríbenos con tu número de pedido.',
        ],
      },
      {
        title: '2. Excepciones',
        bullets: [
          'Productos personalizados o hechos a medida.',
          'Productos de higiene desprecintados tras la entrega.',
          'Velas encendidas o usadas.',
        ],
      },
      {
        title: '3. Condiciones',
        bullets: [
          'Producto sin uso, con empaque original cuando aplique.',
          'Gastos de devolución a cargo del cliente, salvo defecto o error de LUMIA.',
        ],
      },
      {
        title: '4. Reembolso',
        paragraphs: [
          'Tras recibir y revisar la devolución, el reembolso se procesará por el mismo medio acordado en un plazo de 5–10 días hábiles.',
        ],
      },
    ],
  },
}

export const LEGAL_SLUGS = Object.keys(LEGAL_PAGES)

export function getLegalPage(slug: string): LegalPage | null {
  return LEGAL_PAGES[slug] ?? null
}
