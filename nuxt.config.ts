import { fileURLToPath } from 'node:url'

const mongoOptionalDepStub = fileURLToPath(
  new URL('./server/utils/stubs/mongodb-optional-dep.ts', import.meta.url)
)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-07-28',

  devtools: { enabled: true },

  modules: ['@pinia/nuxt', '@nuxt/image', '@vueuse/nuxt'],

  css: ['~/assets/css/main.css'],

  alias: {
    '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  typescript: {
    strict: true,
  },

  app: {
    head: {
      htmlAttrs: { lang: 'es-CO' },
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap',
        },
      ],
    },
  },

  /**
   * El proveedor `ipx` de @nuxt/image depende de `sharp`, un binario nativo que no puede
   * ejecutarse en Cloudflare Workers. Las imágenes se pre-generan en AVIF y se sirven ya
   * optimizadas desde el CDN, por lo que aquí solo se pasan las URLs sin transformar.
   */
  image: {
    provider: 'none',
    domains: ['cdn.jsdelivr.net', 'raw.githubusercontent.com', 'images.unsplash.com'],
  },

  components: [
    { path: '~/components', pathPrefix: false },
    { path: '~/features/shell/components', pathPrefix: false },
    { path: '~/features/product/components', pathPrefix: false },
    { path: '~/features/checkout/components', pathPrefix: false },
    { path: '~/features/ui/components', pathPrefix: false },
    { path: '~/components/legal', pathPrefix: false },
  ],

  imports: {
    dirs: ['composables', 'features/**/composables'],
  },

  pinia: {
    storesDirs: ['./app/features/**/stores'],
  },

  nitro: {
    preset: 'cloudflare_module',
    alias: {
      '@aws-sdk/credential-providers': mongoOptionalDepStub,
      kerberos: mongoOptionalDepStub,
      'gcp-metadata': mongoOptionalDepStub,
      snappy: mongoOptionalDepStub,
      socks: mongoOptionalDepStub,
      '@mongodb-js/zstd': mongoOptionalDepStub,
      'mongodb-client-encryption': mongoOptionalDepStub,
    },
  },

  runtimeConfig: {
    jwtSecret: '',
    jwtRefreshSecret: '',
    siteUrl: '',
    mongoAuthUri: '',
    mongoCatalogUri: '',
    mongoSalesUri: '',
    googleClientId: '',
    googleClientSecret: '',
    resendApiKey: '',
    /** Remitente Resend, ej. LUMIA <pedidos@tudominio.com> */
    resendFrom: '',
    /** Email interno para avisos de nuevos pedidos */
    orderNotifyEmail: '',
    turnstileSecretKey: '',
    mpAccessToken: '',
    mpWebhookSecret: '',
    /** Prefijo legible en `orderNumber` (ej. ORD, CEN). */
    orderNumberPrefix: 'ORD',
    /** TTL en horas para expiración de órdenes con pago Mercado Pago. */
    orderPaymentTtlHours: 24,
    /** TTL en horas para expiración de órdenes con pago manual. */
    orderManualPaymentTtlHours: 72,

    public: {
      storeCurrency: 'COP',
      storeLocale: 'es-CO',
      /** IANA timezone para fechas en tienda (misma salida en SSR y navegador). */
      storeTimezone: 'America/Bogota',
      /** Top N slugs con más unidades vendidas → badge "Más vendido". */
      storeBestsellerTopN: 8,
      /** Umbral mínimo de unidades vendidas para badge "Popular". */
      storePopularMinUnits: 3,
      /** WhatsApp E.164 sin + para wa.me (ej. 573001234567). */
      whatsappPhone: '',
      /** Destino del enlace "Seguir comprando" en `/cart`. */
      cartContinueShoppingPath: '/products',
      /** Si es true, la página del carrito envía `noindex` (útil en staging). */
      cartPageNoIndex: false,
      /** Habilita registro e inicio de sesión con email/contraseña. */
      authLocalProviderEnabled: false,
      /** Base URL del CDN de imágenes de producto, sin barra final. */
      productImagesCdnBase: '',
      /**
       * `flat`: galería en la misma carpeta que el producto (`slug-gallery-n-variant.avif`).
       * `nested`: subcarpeta `gallery/`.
       */
      productImageGalleryLayout: 'flat' as 'flat' | 'nested',
      /** Mercado Pago Public Key para inicializar el SDK del navegador. */
      mpPublicKey: '',
      /** Cloudflare Turnstile site key. */
      turnstileSiteKey: '',
    },
  },
})
