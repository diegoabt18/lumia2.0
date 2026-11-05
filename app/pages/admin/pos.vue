<template>
  <div>
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <!-- Columna izquierda: productos -->
      <section class="space-y-4">
        <div class="rounded-2xl border border-lumia-ink/8 bg-white p-4 shadow-soft sm:p-6">
          <h2 class="font-display text-lg text-lumia-ink">Productos</h2>
          <div class="mt-3 flex gap-2">
            <input
              v-model="productSearch"
              type="text"
              placeholder="Buscar por nombre o SKU…"
              class="lumia-field-input flex-1"
              @keyup.enter="searchProducts"
            />
            <BaseButton @click="searchProducts" :disabled="productsLoading">
              {{ productsLoading ? '…' : 'Buscar' }}
            </BaseButton>
          </div>
          <div v-if="productResults.length" class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="product in productResults"
              :key="product.id"
              class="rounded-xl border border-lumia-ink/8 bg-lumia-cream/30 p-3"
            >
              <div class="flex items-start gap-3">
                <LumiaImage
                  v-if="product.imagePath"
                  :src="product.imagePath"
                  :alt="product.name"
                  img-class="h-14 w-14 rounded-lg object-cover"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-lumia-ink">{{ product.name }}</p>
                  <p class="text-xs text-lumia-ink/50">{{ product.slug }}</p>
                </div>
              </div>
              <div class="mt-3 space-y-2">
                <button
                  v-for="variant in product.variants"
                  :key="variant.sku"
                  type="button"
                  class="flex w-full items-center justify-between rounded-lg border border-lumia-ink/8 bg-white px-3 py-2 text-left text-sm transition hover:border-lumia-gold/40"
                  @click="addToCart(product, variant)"
                >
                  <span class="truncate text-lumia-ink">{{ variant.label }}</span>
                  <span class="ml-2 shrink-0 font-medium text-lumia-ink">
                    {{ formatPrice(variant.price, variant.currency) }}
                  </span>
                </button>
              </div>
            </article>
          </div>
          <p v-else-if="productSearch && !productsLoading" class="mt-4 text-sm text-lumia-ink/50">
            Sin resultados.
          </p>
        </div>
      </section>

      <!-- Columna derecha: carrito y pago -->
      <section class="space-y-4">
        <div class="rounded-2xl border border-lumia-ink/8 bg-white p-4 shadow-soft sm:p-6">
          <h2 class="font-display text-lg text-lumia-ink">Venta</h2>

          <!-- Carrito -->
          <div class="mt-3">
            <div v-if="cart.length" class="divide-y divide-lumia-ink/8">
              <div v-for="line in cart" :key="line.sku" class="flex items-center gap-3 py-3">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-lumia-ink">{{ line.name }}</p>
                  <p v-if="line.variantLabel" class="truncate text-xs text-lumia-ink/50">{{ line.variantLabel }}</p>
                  <p class="text-xs text-lumia-ink/45">
                    {{ formatPrice(line.unitPrice, line.currency) }} × {{ line.quantity }}
                  </p>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded border border-lumia-ink/12 text-lumia-ink/70"
                    @click="decrement(line.sku)"
                  >−</button>
                  <span class="w-6 text-center text-sm">{{ line.quantity }}</span>
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded border border-lumia-ink/12 text-lumia-ink/70"
                    @click="increment(line.sku)"
                  >+</button>
                </div>
                <p class="w-20 text-right text-sm font-medium text-lumia-ink">
                  {{ formatPrice(line.unitPrice * line.quantity, line.currency) }}
                </p>
                <button
                  type="button"
                  class="text-rose-500 hover:text-rose-700"
                  @click="removeLine(line.sku)"
                >✕</button>
              </div>
            </div>
            <p v-else class="text-sm text-lumia-ink/50">Agrega productos para iniciar la venta.</p>
          </div>

          <!-- Totales -->
          <div class="mt-4 space-y-1 border-t border-lumia-ink/8 pt-3 text-sm text-lumia-ink/70">
            <div class="flex justify-between"><span>Subtotal</span><span>{{ formatPrice(subtotal, currency) }}</span></div>
            <div class="flex items-center justify-between gap-2">
              <span>Descuento</span>
              <input
                v-model.number="discountAmount"
                type="number"
                min="0"
                step="0.01"
                class="lumia-field-input w-28 text-right"
              />
            </div>
            <div class="flex justify-between font-semibold text-lumia-ink"><span>Total</span><span>{{ formatPrice(total, currency) }}</span></div>
          </div>

          <!-- Cliente -->
          <div class="mt-4 border-t border-lumia-ink/8 pt-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Cliente</p>
            <div class="mt-2 flex gap-2">
              <button
                type="button"
                class="rounded-full px-3 py-1.5 text-xs font-medium transition"
                :class="customerMode === 'walk_in' ? 'bg-lumia-ink text-lumia-cream' : 'bg-lumia-cream/50 text-lumia-ink/70'"
                @click="customerMode = 'walk_in'"
              >Consumidor final</button>
              <button
                type="button"
                class="rounded-full px-3 py-1.5 text-xs font-medium transition"
                :class="customerMode === 'existing' ? 'bg-lumia-ink text-lumia-cream' : 'bg-lumia-cream/50 text-lumia-ink/70'"
                @click="customerMode = 'existing'"
              >Cliente existente</button>
            </div>

            <div v-if="customerMode === 'walk_in'" class="mt-3 grid gap-2">
              <input v-model="walkInName" type="text" placeholder="Nombre (opcional)" class="lumia-field-input" />
              <input v-model="walkInPhone" type="text" placeholder="Teléfono (opcional)" class="lumia-field-input" />
              <input v-model="walkInEmail" type="email" placeholder="Email (opcional)" class="lumia-field-input" />
            </div>

            <div v-else class="mt-3 space-y-2">
              <div class="flex gap-2">
                <input
                  v-model="customerSearch"
                  type="text"
                  placeholder="Buscar cliente…"
                  class="lumia-field-input flex-1"
                  @keyup.enter="searchCustomers"
                />
                <BaseButton variant="secondary" @click="searchCustomers" :disabled="customersLoading">
                  {{ customersLoading ? '…' : 'Buscar' }}
                </BaseButton>
              </div>
              <ul v-if="customerResults.length" class="max-h-40 overflow-y-auto rounded-lg border border-lumia-ink/8">
                <li
                  v-for="c in customerResults"
                  :key="c.id"
                  class="cursor-pointer px-3 py-2 text-sm hover:bg-lumia-cream/40"
                  :class="selectedCustomer?.id === c.id && 'bg-lumia-gold/10'"
                  @click="selectedCustomer = c"
                >
                  <span class="font-medium text-lumia-ink">{{ c.name }}</span>
                  <span v-if="c.email" class="ml-2 text-xs text-lumia-ink/50">{{ c.email }}</span>
                </li>
              </ul>
              <p v-if="selectedCustomer" class="text-xs text-lumia-ink/60">
                Seleccionado: <span class="font-medium">{{ selectedCustomer.name }}</span>
              </p>
            </div>
          </div>

          <!-- Método de pago -->
          <div class="mt-4 border-t border-lumia-ink/8 pt-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Método de pago</p>
            <div class="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                v-for="method in paymentMethods"
                :key="method.methodId"
                type="button"
                class="rounded-xl border px-3 py-2 text-left text-sm transition"
                :class="paymentMethod === method.methodId ? 'border-lumia-gold bg-lumia-gold/5' : 'border-lumia-ink/8 bg-white hover:border-lumia-gold/40'"
                @click="paymentMethod = method.methodId"
              >
                <p class="font-medium text-lumia-ink">{{ method.displayName }}</p>
                <p class="text-xs text-lumia-ink/50">{{ method.description }}</p>
              </button>
            </div>

            <!-- Efectivo -->
            <div v-if="paymentMethod === 'cash'" class="mt-3 rounded-xl border border-lumia-ink/8 bg-lumia-cream/30 p-3">
              <label class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Importe recibido</label>
              <input
                v-model.number="cashReceived"
                type="number"
                min="0"
                step="0.01"
                class="lumia-field-input mt-1"
              />
              <div class="mt-2 flex justify-between text-sm">
                <span class="text-lumia-ink/60">Cambio</span>
                <span class="font-medium text-lumia-ink">{{ formatPrice(change, currency) }}</span>
              </div>
              <p v-if="cashReceived !== null && cashReceived < total" class="mt-1 text-xs text-rose-600">
                El importe recibido no puede ser inferior al total.
              </p>
            </div>

            <!-- Transferencia -->
            <div v-if="paymentMethod === 'bank_transfer'" class="mt-3 rounded-xl border border-lumia-ink/8 bg-lumia-cream/30 p-3">
              <p class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Datos bancarios</p>
              <p class="mt-1 text-sm text-lumia-ink">{{ bankInfo.bank }}</p>
              <p class="text-sm text-lumia-ink/70">Cuenta: {{ bankInfo.account }}</p>
              <p class="text-sm text-lumia-ink/70">Titular: {{ bankInfo.holder }}</p>
              <label class="mt-3 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Referencia / comprobante</label>
              <input v-model="transferReference" type="text" class="lumia-field-input mt-1" placeholder="Número de comprobante" />
              <p class="mt-2 text-xs text-lumia-ink/50">
                La venta quedará pendiente hasta que confirmes la recepción del dinero.
              </p>
            </div>

            <!-- Estado del pago -->
            <div class="mt-3">
              <label class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Estado inicial</label>
              <select v-model="paymentState" class="lumia-field-input mt-1" :disabled="paymentMethod === 'bank_transfer'">
                <option value="pending_manual">Pendiente de pago manual</option>
                <option v-if="paymentMethod !== 'bank_transfer'" value="paid">Pagado</option>
              </select>
              <p v-if="paymentMethod === 'bank_transfer'" class="mt-1 text-xs text-lumia-ink/50">
                Las transferencias se crean pendientes y se confirman después.
              </p>
            </div>
          </div>

          <!-- Notas -->
          <div class="mt-4 border-t border-lumia-ink/8 pt-4">
            <label class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Notas (opcional)</label>
            <textarea v-model="notes" rows="2" class="lumia-field-input mt-1 resize-y" />
          </div>

          <p v-if="submitError" class="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {{ submitError }}
          </p>

          <BaseButton
            class="mt-4 w-full"
            :disabled="isSubmitting || !cart.length || !canSubmit"
            @click="submitSale"
          >
            {{ isSubmitting ? 'Registrando…' : 'Registrar venta' }}
          </BaseButton>
        </div>

        <!-- Resultado -->
        <div v-if="lastSale" class="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-soft sm:p-6">
          <h3 class="font-display text-lg text-lumia-ink">Venta registrada</h3>
          <p class="mt-1 text-sm text-lumia-ink/70">
            Comprobante: <span class="font-medium">{{ lastSale.order.receiptNumber }}</span>
          </p>
          <p class="text-sm text-lumia-ink/70">
            Total: <span class="font-medium">{{ formatPrice(lastSale.order.total, lastSale.order.currency) }}</span>
          </p>
          <p class="text-sm text-lumia-ink/70">
            Estado: <span class="font-medium">{{ statusLabel(lastSale.order.paymentStatus) }}</span>
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            <a
              :href="receiptUrl(lastSale)"
              target="_blank"
              class="inline-flex items-center rounded-full border border-lumia-ink/12 bg-white px-4 py-2 text-sm font-medium text-lumia-ink hover:bg-lumia-cream/40"
            >
              Ver comprobante
            </a>
            <BaseButton
              v-if="lastSale.order.paymentStatus !== 'paid'"
              variant="secondary"
              @click="openConfirmDialog"
            >
              Confirmar pago
            </BaseButton>
            <BaseButton variant="ghost" @click="resetForm">Nueva venta</BaseButton>
          </div>
        </div>
      </section>
    </div>

    <!-- Dialogo confirmar pago -->
    <div v-if="confirmDialogOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
        <h3 class="font-display text-lg text-lumia-ink">Confirmar pago</h3>
        <p class="mt-1 text-sm text-lumia-ink/60">
          Venta {{ lastSale?.order.receiptNumber }} — {{ formatPrice(lastSale?.order.total ?? 0, lastSale?.order.currency ?? 'COP') }}
        </p>

        <div v-if="lastSale?.order.paymentMethod === 'cash'" class="mt-4 space-y-3">
          <div>
            <label class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Importe recibido</label>
            <input v-model.number="confirmCashReceived" type="number" min="0" step="0.01" class="lumia-field-input mt-1" />
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-lumia-ink/60">Cambio</span>
            <span class="font-medium text-lumia-ink">{{ formatPrice(confirmChange, lastSale?.order.currency ?? 'COP') }}</span>
          </div>
        </div>

        <div v-if="lastSale?.order.paymentMethod === 'bank_transfer'" class="mt-4 space-y-3">
          <div>
            <label class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Referencia / comprobante</label>
            <input v-model="confirmTransferReference" type="text" class="lumia-field-input mt-1" />
          </div>
        </div>

        <div class="mt-3">
          <label class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Nota (opcional)</label>
          <input v-model="confirmNote" type="text" class="lumia-field-input mt-1" />
        </div>

        <p v-if="confirmError" class="mt-3 text-sm text-rose-600">{{ confirmError }}</p>

        <div class="mt-4 flex justify-end gap-2">
          <BaseButton variant="ghost" @click="confirmDialogOpen = false">Cancelar</BaseButton>
          <BaseButton :disabled="confirming" @click="confirmPayment">
            {{ confirming ? 'Confirmando…' : 'Marcar como pagado' }}
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PosPaymentMethod, PosProduct, PosCustomer, PosCartItem, PosSaleResult } from '#shared/types/pos'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { formatPrice } = useUtils()
const toast = useToast()
const {
  getPaymentMethods,
  searchProducts: apiSearchProducts,
  searchCustomers: apiSearchCustomers,
  createSale,
  confirmPayment: confirmPaymentApi,
} = usePosApi()

const paymentMethods = ref<PosPaymentMethod[]>([])
const paymentMethod = ref('cash')
const paymentState = ref('pending_manual')

const productSearch = ref('')
const productsLoading = ref(false)
const productResults = ref<PosProduct[]>([])

const cart = ref<PosCartItem[]>([])

const discountAmount = ref(0)
const notes = ref('')

const customerMode = ref<'walk_in' | 'existing'>('walk_in')
const walkInName = ref('')
const walkInPhone = ref('')
const walkInEmail = ref('')
const customerSearch = ref('')
const customersLoading = ref(false)
const customerResults = ref<PosCustomer[]>([])
const selectedCustomer = ref<PosCustomer | null>(null)

const cashReceived = ref<number | null>(null)
const transferReference = ref('')

const isSubmitting = ref(false)
const submitError = ref('')
const lastSale = ref<PosSaleResult | null>(null)
const idempotencyKey = ref(crypto.randomUUID())

const confirmDialogOpen = ref(false)
const confirmCashReceived = ref<number | null>(null)
const confirmTransferReference = ref('')
const confirmNote = ref('')
const confirming = ref(false)
const confirmError = ref('')

const bankInfo = {
  bank: 'Bancolombia',
  account: '123-456789-00',
  holder: 'Lumia S.A.S. — NIT 900.000.000-0',
}

onMounted(async () => {
  try {
    const res = await getPaymentMethods()
    paymentMethods.value = res.methods
    if (res.methods.length && !res.methods.find((m) => m.methodId === paymentMethod.value)) {
      paymentMethod.value = res.methods[0]!.methodId
    }
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message ?? 'No se pudieron cargar los métodos de pago')
  }
})

watch(paymentMethod, (m) => {
  if (m === 'bank_transfer') paymentState.value = 'pending_manual'
})

const subtotal = computed(() => cart.value.reduce((s, l) => s + l.unitPrice * l.quantity, 0))
const currency = computed(() => cart.value[0]?.currency ?? 'COP')
const total = computed(() => Math.max(0, subtotal.value - (discountAmount.value || 0)))
const change = computed(() => {
  if (cashReceived.value === null) return 0
  return cashReceived.value - total.value
})
const confirmChange = computed(() => {
  if (!lastSale.value || confirmCashReceived.value === null) return 0
  return confirmCashReceived.value - lastSale.value.order.total
})
const canSubmit = computed(() => {
  if (!cart.value.length) return false
  if (paymentMethod.value === 'cash' && paymentState.value === 'paid') {
    if (cashReceived.value === null || cashReceived.value < total.value) return false
  }
  return true
})

async function searchProducts() {
  productsLoading.value = true
  try {
    const res = await apiSearchProducts(productSearch.value, 12)
    productResults.value = res.products
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message ?? 'Error al buscar productos')
  } finally {
    productsLoading.value = false
  }
}

async function searchCustomers() {
  customersLoading.value = true
  try {
    const res = await apiSearchCustomers(customerSearch.value, 10)
    customerResults.value = res.customers
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message ?? 'Error al buscar clientes')
  } finally {
    customersLoading.value = false
  }
}

function addToCart(product: PosProduct, variant: PosProduct['variants'][number]) {
  const existing = cart.value.find((l) => l.sku === variant.sku)
  if (existing) {
    existing.quantity += 1
  } else {
    cart.value.push({
      sku: variant.sku,
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      variantLabel: variant.label,
      imageUrl: product.imagePath,
      unitPrice: variant.price,
      originalUnitPrice: variant.originalPrice,
      quantity: 1,
      currency: variant.currency,
      tracked: variant.tracked,
      isPerOrder: variant.isPerOrder,
    })
  }
}

function increment(sku: string) {
  const line = cart.value.find((l) => l.sku === sku)
  if (line) line.quantity += 1
}

function decrement(sku: string) {
  const line = cart.value.find((l) => l.sku === sku)
  if (!line) return
  if (line.quantity > 1) line.quantity -= 1
  else removeLine(sku)
}

function removeLine(sku: string) {
  cart.value = cart.value.filter((l) => l.sku !== sku)
}

function buildPayload() {
  const customer =
    customerMode.value === 'existing' && selectedCustomer.value
      ? { mode: 'existing', userId: selectedCustomer.value.id }
      : {
          mode: 'walk_in',
          name: walkInName.value.trim() || undefined,
          phone: walkInPhone.value.trim() || undefined,
          email: walkInEmail.value.trim() || undefined,
        }

  const payment: Record<string, unknown> = {
    method: paymentMethod.value,
    state: paymentState.value,
  }
  if (paymentMethod.value === 'cash' && paymentState.value === 'paid') {
    payment.cashReceived = cashReceived.value ?? total.value
    payment.changeGiven = Math.max(0, (cashReceived.value ?? total.value) - total.value)
  }
  if (paymentMethod.value === 'bank_transfer') {
    payment.transferReference = transferReference.value.trim() || undefined
  }

  return {
    customer,
    items: cart.value.map((l) => ({ sku: l.sku, quantity: l.quantity })),
    payment,
    discountAmount: discountAmount.value || 0,
    notes: notes.value.trim() || undefined,
  }
}

async function submitSale() {
  submitError.value = ''
  if (!cart.value.length) {
    submitError.value = 'Agrega al menos un producto.'
    return
  }
  if (customerMode.value === 'existing' && !selectedCustomer.value) {
    submitError.value = 'Selecciona un cliente existente.'
    return
  }
  isSubmitting.value = true
  try {
    const result = await createSale(buildPayload(), idempotencyKey.value)
    lastSale.value = result
    toast.success('Venta registrada')
    // limpiar
    cart.value = []
    discountAmount.value = 0
    notes.value = ''
    cashReceived.value = null
    transferReference.value = ''
    idempotencyKey.value = crypto.randomUUID()
    confirmCashReceived.value = result.order.cashReceived ?? null
    confirmTransferReference.value = result.order.transferReference ?? ''
  } catch (e: unknown) {
    const err = e as { data?: { message?: string; statusMessage?: string }; message?: string }
    submitError.value = err?.data?.message || err?.data?.statusMessage || err?.message || 'No se pudo registrar la venta'
    toast.error(submitError.value)
  } finally {
    isSubmitting.value = false
  }
}

function receiptUrl(sale: PosSaleResult) {
  return sale.receiptUrl.startsWith('http') ? sale.receiptUrl : sale.receiptUrl
}

function statusLabel(status: string) {
  if (status === 'pending_manual') return 'Pendiente de pago'
  if (status === 'paid') return 'Pagado'
  return status
}

function openConfirmDialog() {
  if (!lastSale.value) return
  confirmCashReceived.value = lastSale.value.order.cashReceived ?? lastSale.value.order.total
  confirmTransferReference.value = lastSale.value.order.transferReference ?? ''
  confirmNote.value = ''
  confirmError.value = ''
  confirmDialogOpen.value = true
}

async function confirmPayment() {
  if (!lastSale.value) return
  confirming.value = true
  confirmError.value = ''
  try {
    const payload: Record<string, unknown> = { note: confirmNote.value.trim() || undefined }
    if (lastSale.value.order.paymentMethod === 'cash') {
      payload.cashReceived = confirmCashReceived.value ?? lastSale.value.order.total
      payload.changeGiven = Math.max(0, (confirmCashReceived.value ?? lastSale.value.order.total) - lastSale.value.order.total)
    }
    if (lastSale.value.order.paymentMethod === 'bank_transfer') {
      payload.transferReference = confirmTransferReference.value.trim() || undefined
    }
    const updated = await confirmPaymentApi(lastSale.value.order.id, payload)
    lastSale.value.order = updated
    toast.success('Pago confirmado')
    confirmDialogOpen.value = false
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    confirmError.value = err?.data?.message ?? 'No se pudo confirmar el pago'
  } finally {
    confirming.value = false
  }
}

function resetForm() {
  lastSale.value = null
  cart.value = []
  discountAmount.value = 0
  notes.value = ''
  cashReceived.value = null
  transferReference.value = ''
  idempotencyKey.value = crypto.randomUUID()
}
</script>