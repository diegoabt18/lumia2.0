<template>
  <div>
    <!-- Encabezado del POS -->
    <header class="mb-6 rounded-2xl border border-lumia-ink/8 bg-gradient-to-r from-lumia-black to-lumia-gray/80 p-4 shadow-lg sm:p-6">
      <h1 class="font-display text-xl font-bold text-white md:text-2xl">Punto de Venta</h1>
      <p class="mt-1 text-sm text-lumia-gray/80">Sistema POS para procesamiento de ventas</p>
    </header>

    <!-- Layout principal con dos áreas (catálogo y panel de venta) -->
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <!-- Columna izquierda: búsqueda y resultados de productos -->
      <main class="flex min-w-0 flex-col space-y-4">
        <section class="rounded-2xl border border-lumia-ink/8 bg-white p-4 shadow-soft sm:p-5">
          <!-- Barra de búsqueda: los productos solo aparecen tras buscar explícitamente -->
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div class="relative min-w-0 flex-1">
              <IconSearch class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lumia-ink/35" stroke-width="1.5" />
              <input
                v-model="productSearchInput"
                type="search"
                placeholder="Buscar por nombre, SKU o código de barras..."
                aria-label="Buscar productos"
                class="lumia-field-input h-10 w-full pl-9 pr-9 text-sm"
                @keydown.enter.prevent="submitProductSearch"
              />
              <button
                v-if="productSearchInput"
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-lumia-ink/40 hover:text-lumia-ink"
                aria-label="Limpiar búsqueda"
                @click="clearProductSearch"
              >
                <IconX class="h-4 w-4" />
              </button>
            </div>
            <BaseButton
              class="h-10 px-5 text-sm"
              :disabled="productsLoading || !productSearchInput.trim()"
              @click="submitProductSearch"
            >
              {{ productsLoading ? 'Buscando…' : 'Buscar' }}
            </BaseButton>
          </div>

          <!-- Carga: filas esqueleto con la misma estructura de la tabla -->
          <div v-if="productsLoading" class="mt-4 divide-y divide-lumia-ink/8 rounded-xl border border-lumia-ink/8" role="status" aria-label="Buscando productos">
            <div v-for="n in 6" :key="n" class="flex h-16 items-center gap-3 px-3 animate-pulse">
              <div class="h-11 w-11 shrink-0 rounded-lg bg-lumia-ink/8" />
              <div class="flex-1 space-y-2">
                <div class="h-3 w-1/3 rounded bg-lumia-ink/8" />
                <div class="h-2.5 w-1/5 rounded bg-lumia-ink/6" />
              </div>
              <div class="hidden h-3 w-24 rounded bg-lumia-ink/8 md:block" />
              <div class="h-3 w-16 rounded bg-lumia-ink/8" />
              <div class="h-3 w-20 rounded bg-lumia-ink/8" />
              <div class="h-8 w-8 rounded-lg bg-lumia-ink/8" />
            </div>
          </div>

          <!-- Error con reintento -->
          <div v-else-if="productsError" class="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
            <p>{{ productsError }}</p>
            <button type="button" class="mt-2 font-medium underline" @click="runProductSearch(productPage)">Reintentar</button>
          </div>

          <!-- Estado inicial: sin catálogo ni búsqueda automática -->
          <div v-else-if="!hasSearched" class="mt-4 flex flex-col items-center rounded-xl border border-dashed border-lumia-ink/15 px-6 py-12 text-center">
            <IconPackage class="h-10 w-10 text-lumia-ink/25" stroke-width="1.25" />
            <p class="mt-3 font-display text-base text-lumia-ink">Busca un producto para comenzar</p>
            <p class="mt-1 text-sm text-lumia-ink/55">Escribe el nombre, SKU o código de barras y presiona Enter.</p>
          </div>

          <!-- Sin coincidencias -->
          <div v-else-if="!productResults.length" class="mt-4 flex flex-col items-center rounded-xl border border-lumia-ink/10 bg-lumia-cream/20 px-6 py-10 text-center">
            <p class="font-medium text-lumia-ink">No encontramos productos con esa búsqueda.</p>
            <p class="mt-1 text-sm text-lumia-ink/55">Revisa el nombre, SKU o código, o limpia la búsqueda.</p>
            <button type="button" class="mt-3 text-sm font-medium text-lumia-ink underline" @click="clearProductSearch">Limpiar búsqueda</button>
          </div>

          <!-- Resultados -->
          <template v-else>
            <p class="mt-4 text-xs text-lumia-ink/55">
              {{ productTotal }} {{ productTotal === 1 ? 'resultado' : 'resultados' }} para "{{ submittedQuery }}"
            </p>
            <div class="mt-2 overflow-x-auto rounded-xl border border-lumia-ink/8">
              <table class="w-full min-w-[640px] text-sm">
                <thead class="bg-lumia-cream/30 text-left text-[11px] font-semibold uppercase tracking-wide text-lumia-ink/50">
                  <tr>
                    <th class="w-[60px] px-3 py-2"><span class="sr-only">Imagen</span></th>
                    <th class="px-3 py-2">Producto</th>
                    <th class="hidden px-3 py-2 md:table-cell">SKU / Código</th>
                    <th class="px-3 py-2">Stock</th>
                    <th class="px-3 py-2 text-right">Precio</th>
                    <th class="w-[72px] px-3 py-2"><span class="sr-only">Acción</span></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-lumia-ink/8">
                  <tr
                    v-for="product in productResults"
                    :key="product.id"
                    class="h-16 transition-colors duration-150 hover:bg-lumia-cream/25"
                  >
                    <td class="px-3">
                      <ProductThumbnail :slug="product.slug" :image-path="product.imagePath" :alt="product.name" :size="44" />
                    </td>
                    <td class="min-w-0 px-3">
                      <p class="truncate font-medium text-lumia-ink" :title="product.name">{{ product.name }}</p>
                      <select
                        v-if="product.variants.length > 1"
                        class="lumia-field-input mt-1 h-7 w-full max-w-[220px] px-2 py-0 text-xs"
                        :class="selectedSku(product) ? '' : 'border-amber-400'"
                        :value="selectedSku(product) ?? ''"
                        aria-label="Elegir presentación"
                        @change="selectVariant(product, ($event.target as HTMLSelectElement).value)"
                      >
                        <option value="" disabled>Elegir presentación</option>
                        <option v-for="variant in product.variants" :key="variant.sku" :value="variant.sku" :disabled="!isSellable(variant)">
                          {{ variant.label }}{{ isSellable(variant) ? '' : ' (agotado)' }}
                        </option>
                      </select>
                      <p v-else-if="productVariant(product)" class="truncate text-xs text-lumia-ink/55">{{ productVariant(product)!.label }}</p>
                      <p v-else class="text-xs text-lumia-ink/50">Sin presentación a la venta</p>
                    </td>
                    <td class="hidden px-3 md:table-cell">
                      <template v-if="productVariant(product)">
                        <p class="font-mono text-xs text-lumia-ink/70">{{ productVariant(product)!.sku }}</p>
                        <p v-if="productVariant(product)!.barcode" class="font-mono text-[11px] text-lumia-ink/45">{{ productVariant(product)!.barcode }}</p>
                      </template>
                      <p v-else class="text-xs text-lumia-ink/35">—</p>
                    </td>
                    <td class="px-3">
                      <template v-if="productVariant(product)">
                        <span class="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium" :class="stockClass(productVariant(product)!)">
                          <span class="h-1.5 w-1.5 rounded-full" :class="stockDotClass(productVariant(product)!)" />
                          {{ stockText(productVariant(product)!) }}
                        </span>
                      </template>
                      <span v-else class="text-xs text-lumia-ink/35">—</span>
                    </td>
                    <td class="px-3 text-right">
                      <template v-if="productVariant(product)">
                        <p class="font-semibold tabular-nums text-lumia-ink">
                          {{ formatPrice(productVariant(product)!.price, productVariant(product)!.currency) }}
                        </p>
                        <p
                          v-if="productVariant(product)!.originalPrice !== productVariant(product)!.price"
                          class="text-[11px] tabular-nums text-lumia-ink/40 line-through"
                        >
                          {{ formatPrice(productVariant(product)!.originalPrice, productVariant(product)!.currency) }}
                        </p>
                      </template>
                      <span v-else class="text-xs text-lumia-ink/35">—</span>
                    </td>
                    <td class="px-3 text-right">
                      <button
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-lumia-ink text-lumia-cream shadow-sm transition hover:bg-lumia-ink/85 focus:outline-none focus:ring-2 focus:ring-lumia-primary/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                        :disabled="!productVariant(product) || !isSellable(productVariant(product)!)"
                        :aria-label="`Agregar ${product.name} al carrito`"
                        :title="productVariant(product) ? 'Agregar al carrito' : 'Elige una presentación'"
                        @click="addProductToCart(product)"
                      >
                        <IconShoppingCartPlus class="h-4 w-4" stroke-width="1.5" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Paginación: solo cuando hay más resultados que una página -->
            <PosProductPagination
              v-if="productTotal > PRODUCT_PAGE_SIZE_OPTIONS[0]!"
              class="mt-3"
              :page="productPage"
              :page-size="productPageSize"
              :total="productTotal"
              :total-pages="productTotalPages"
              :page-size-options="PRODUCT_PAGE_SIZE_OPTIONS"
              @change-page="goToProductPage"
              @change-size="changeProductPageSize"
            />
          </template>
        </section>
      </main>

      <!-- Columna derecha: panel de venta (carrito, cliente, pago) -->
      <section class="space-y-4">
        <div class="flex flex-col rounded-2xl border border-lumia-ink/8 bg-white shadow-sm sm:p-6">
          <header class="mb-3 pb-2 border-b border-lumia-ink/8">
            <h2 class="font-display text-lg font-bold text-lumia-ink">Venta</h2>
            <p class="text-xs text-lumia-gray/50">Panel de procesamiento de transacciones</p>
          </header>

          <!-- Carrito -->
          <section class="flex-1">
            <div class="mb-3 flex items-center justify-between">
              <h3 class="text-sm font-semibold uppercase tracking-wide text-lumia-gray/60">
                <svg class="mr-1.5 inline-block h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                Items seleccionados
              </h3>
              <span class="text-xs text-lumia-gray/50">{{ cart.length }} productos</span>
            </div>

            <!-- Lista de items en el carrito -->
            <div v-if="cart.length" class="divide-y divide-lumia-ink/8 rounded-xl bg-lumia-gray/30 p-3">
              <div v-for="line in cart" :key="line.sku" class="group flex items-center gap-3 py-2.5 hover:bg-lumia-cream/30 transition-colors duration-150">
                <!-- Nombre del producto -->
                <div class="min-w-0 flex-1">
                  <p 
                    class="truncate font-medium text-sm text-lumia-ink"
                    :title="line.name"
                  >
                    {{ line.name }}
                  </p>
                  <p v-if="line.variantLabel" class="truncate text-xs text-lumia-ink/50">
                    {{ line.variantLabel }}
                  </p>
                  <p class="mt-1 text-xs font-mono text-lumia-gray/50">
                    {{ formatPrice(line.unitPrice, line.currency) }} × {{ line.quantity }}
                  </p>
                </div>

                <!-- Controles de cantidad -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg border border-lumia-ink/12 text-lumia-ink/70 transition-all duration-150 active:scale-95 hover:border-lumia-ink/30 hover:bg-lumia-gray/50 focus:outline-none focus:ring-2 focus:ring-lumia-primary/20"
                    @click="decrement(line.sku)"
                    :aria-label="`Reducir cantidad de ${line.name}`"
                  >−</button>
                  <span 
                    class="min-w-[1.5rem] text-center text-sm font-medium text-lumia-ink"
                    :class="{ 'font-bold': line.quantity === 1 }"
                  >
                    {{ line.quantity }}
                  </span>
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg border border-lumia-ink/12 text-lumia-ink/70 transition-all duration-150 active:scale-95 hover:border-lumia-ink/30 hover:bg-lumia-gray/50 focus:outline-none focus:ring-2 focus:ring-lumia-primary/20"
                    @click="increment(line.sku)"
                    :aria-label="`Aumentar cantidad de ${line.name}`"
                  >+</button>
                </div>

                <!-- Subtotal -->
                <p class="w-24 text-right text-sm font-semibold text-lumia-ink">
                  {{ formatPrice(line.unitPrice * line.quantity, line.currency) }}
                </p>

                <!-- Botón eliminar -->
                <button
                  type="button"
                  class="rounded-lg p-1.5 text-rose-500 opacity-0 transition-all duration-150 hover:bg-rose-50 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  @click="removeLine(line.sku)"
                  :aria-label="`Eliminar ${line.name} del carrito`"
                >✕</button>
              </div>
            </div>

            <!-- Estado vacío -->
            <p v-else class="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-lumia-gray/20 bg-lumia-gray/5 text-sm text-lumia-gray/50">
              {{ cart.length === 0 ? 'Agrega productos para iniciar la venta' : 'Carrito vacío' }}
            </p>

            <!-- Totales -->
            <div class="mt-4 rounded-xl border border-lumia-ink/8 bg-gradient-to-br from-white to-lumia-gray/20 p-3">
              <div class="space-y-1.5 text-xs">
                <div class="flex justify-between">
                  <span class="text-lumia-gray/60">Subtotal</span>
                  <span class="font-medium text-lumia-ink">{{ formatPrice(subtotal, currency) }}</span>
                </div>
                <div class="flex items-center justify-between gap-1">
                  <label for="discountAmount" class="text-lumia-gray/60">Descuento</label>
                  <input
                    id="discountAmount"
                    v-model.number="discountAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    class="lumia-field-input w-28 text-right font-mono"
                    :class="discountError ? 'border-rose-400 focus:border-rose-500' : ''"
                    :aria-invalid="!!discountError"
                  />
                </div>
                <p v-if="discountError" class="text-right text-xs text-rose-600">{{ discountError }}</p>
                <div class="flex justify-between border-t border-lumia-ink/8 pt-2">
                  <span class="font-bold text-base text-lumia-ink">Total</span>
                  <span class="text-xl font-extrabold tracking-tight text-lumia-primary">{{ formatPrice(total, currency) }}</span>
                </div>
              </div>
            </div>
          </section>

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
                  <span v-if="c.source === 'counter'" class="ml-2 rounded bg-lumia-cream px-1.5 py-0.5 text-[10px] font-medium uppercase text-lumia-ink/60">Mostrador</span>
                  <span v-if="c.email" class="ml-2 text-xs text-lumia-ink/50">{{ c.email }}</span>
                  <span v-if="c.phone" class="ml-2 text-xs text-lumia-ink/50">· {{ c.phone }}</span>
                </li>
              </ul>
              <p
                v-else-if="customerSearchDone && !customersLoading"
                class="rounded-lg bg-lumia-gray/50 px-3 py-2 text-xs text-lumia-ink/60"
              >
                No se encontraron clientes con "{{ customerSearchDone }}". Revisa el término o usa Consumidor final.
              </p>
              <p v-if="customersLoading" class="text-xs text-lumia-ink/50" role="status">Buscando clientes…</p>
              <p v-if="selectedCustomer" class="text-xs text-lumia-ink/60">
                Seleccionado: <span class="font-medium">{{ selectedCustomer.name }}</span>
              </p>
            </div>
          </div>

          <!-- Método de pago (independiente del estado) -->
          <div class="mt-4 border-t border-lumia-ink/8 pt-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Método de pago</p>
            <div class="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                v-for="method in paymentMethods"
                :key="method.methodId"
                type="button"
                class="rounded-xl border px-3 py-2 text-left text-sm transition"
                :class="paymentMethod === method.methodId ? 'border-lumia-gold bg-lumia-gold/5' : 'border-lumia-ink/8 bg-white hover:border-lumia-gold/40'"
                @click="selectPaymentMethod(method.methodId)"
              >
                <p class="font-medium text-lumia-ink">{{ method.displayName }}</p>
                <p class="text-xs text-lumia-ink/50">{{ method.description }}</p>
              </button>
            </div>

            <p v-if="!paymentMethods.length" class="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              No hay métodos de pago habilitados para ventas presenciales. Revísalos en la configuración de la tienda.
            </p>

            <!-- Efectivo -->
            <div v-if="paymentMethod === 'cash'" class="mt-3 rounded-xl border border-lumia-ink/8 bg-lumia-cream/30 p-3">
              <label class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Importe recibido</label>
              <input
                v-model.number="cashReceived"
                type="number"
                min="0"
                step="0.01"
                class="lumia-field-input mt-1"
                :placeholder="String(total)"
                :class="cashShortfall ? 'border-rose-400 focus:border-rose-500' : ''"
                :aria-invalid="cashShortfall"
              />
              <div class="mt-2 flex justify-between text-sm">
                <span class="text-lumia-ink/60">Cambio</span>
                <span class="font-medium" :class="change < 0 ? 'text-rose-600' : 'text-lumia-ink'">
                  {{ formatPrice(Math.max(0, change), currency) }}
                </span>
              </div>
              <p v-if="cashReceived !== null && cashReceived < total" class="mt-1 text-xs text-rose-600">
                El importe recibido no puede ser inferior al total.
              </p>
              <p v-else-if="paymentState === 'paid'" class="mt-1 text-xs text-lumia-ink/50">
                Se registrarán el importe recibido y el cambio al confirmar la venta como pagada.
              </p>
            </div>

            <!-- Transferencia -->
            <div v-if="paymentMethod === 'bank_transfer'" class="mt-3 rounded-xl border border-lumia-ink/8 bg-lumia-cream/30 p-3">
              <p class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Datos bancarios</p>
              <template v-if="bankTransferDetails">
                <p class="mt-1 text-sm text-lumia-ink">{{ bankTransferDetails.bankName }}</p>
                <p class="text-sm text-lumia-ink/70">Cuenta: {{ bankTransferDetails.accountNumber }}</p>
                <p class="text-sm text-lumia-ink/70">Titular: {{ bankTransferDetails.accountHolder }}</p>
                <p v-if="bankTransferDetails.taxId" class="text-sm text-lumia-ink/70">NIT / ID: {{ bankTransferDetails.taxId }}</p>
                <p v-if="bankTransferDetails.instructions" class="mt-2 text-xs text-lumia-ink/60">{{ bankTransferDetails.instructions }}</p>
              </template>
              <p v-else class="mt-1 text-sm text-amber-700">
                No hay datos bancarios configurados. Configúralos en ajustes de métodos de pago de la tienda.
              </p>
              <label class="mt-3 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Referencia / comprobante</label>
              <input v-model="transferReference" type="text" class="lumia-field-input mt-1" placeholder="Número de comprobante" />
              <p class="mt-2 text-xs text-lumia-ink/50">
                Seleccionar transferencia no marca la venta como pagada. Quedará pendiente hasta que verifiques el ingreso.
              </p>
            </div>

            <!-- Estado del pago (separado del método) -->
            <div class="mt-3">
              <label class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Estado del pago</label>
              <select
                v-model="paymentState"
                class="lumia-field-input mt-1"
                :disabled="!selectedMethodSupportsPaid"
              >
                <option value="pending_manual">Pendiente de pago manual</option>
                <option v-if="selectedMethodSupportsPaid" value="paid">Pagado</option>
              </select>
              <p v-if="!selectedMethodSupportsPaid" class="mt-1 text-xs text-lumia-ink/50">
                Este método requiere verificación manual antes de marcarse como pagado.
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

          <p v-if="hasMixedCurrency" class="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            La venta tiene productos en distintas monedas. Separa los productos en ventas diferentes.
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
            Saldo pendiente:
            <span class="font-medium" :class="balanceOf(lastSale.order) > 0 ? 'text-amber-700' : 'text-emerald-700'">
              {{ formatPrice(balanceOf(lastSale.order), lastSale.order.currency) }}
            </span>
          </p>
          <p class="text-sm text-lumia-ink/70">
            Método: <span class="font-medium">{{ methodLabel(lastSale.order.paymentMethod) }}</span>
          </p>
          <p class="text-sm text-lumia-ink/70">
            Estado: <span class="font-medium">{{ statusLabel(lastSale.order.paymentStatus) }}</span>
          </p>
          <p v-if="lastSale.order.cashReceived != null" class="text-sm text-lumia-ink/70">
            Recibido: <span class="font-medium">{{ formatPrice(lastSale.order.cashReceived, lastSale.order.currency) }}</span>
            <span v-if="lastSale.order.changeGiven != null">
              · Cambio: <span class="font-medium">{{ formatPrice(lastSale.order.changeGiven, lastSale.order.currency) }}</span>
            </span>
          </p>
          <p v-if="lastSale.order.transferReference" class="text-sm text-lumia-ink/70">
            Referencia: <span class="font-medium">{{ lastSale.order.transferReference }}</span>
          </p>
          <p v-if="lastSale.order.paymentConfirmedAt" class="text-sm text-lumia-ink/70">
            Confirmado {{ formatDateTime(lastSale.order.paymentConfirmedAt) }}
            <span v-if="lastSale.order.paymentConfirmedByUserId">
              por {{ confirmationActorLabel(lastSale.order.paymentConfirmedByUserId) }}
            </span>
          </p>

          <div v-if="lastSale.order.paymentEvents?.length" class="mt-3 rounded-xl border border-emerald-200/80 bg-white/70 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Historial de pago</p>
            <ul class="mt-2 space-y-1.5">
              <li
                v-for="(event, index) in lastSale.order.paymentEvents"
                :key="`${event.type}-${event.timestamp}-${index}`"
                class="text-xs text-lumia-ink/70"
              >
                <span class="font-medium text-lumia-ink">{{ paymentEventLabel(event.type) }}</span>
                · {{ formatDateTime(event.timestamp) }}
                <span v-if="event.actorId"> · {{ confirmationActorLabel(event.actorId) }}</span>
              </li>
            </ul>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <a
              :href="receiptUrl(lastSale)"
              target="_blank"
              class="inline-flex items-center rounded-full border border-lumia-ink/12 bg-white px-4 py-2 text-sm font-medium text-lumia-ink hover:bg-lumia-cream/40"
            >
              Ver comprobante
            </a>
            <div
              v-if="balanceOf(lastSale.order) > 0 && can('orders.update')"
              class="w-full rounded-xl border border-emerald-200/80 bg-white/70 p-3"
            >
              <p class="text-sm font-medium text-lumia-ink">Registrar abono</p>
              <div class="mt-2 grid gap-2 sm:grid-cols-3">
                <p class="lumia-field-input flex items-center tabular-nums">{{ formatPrice(nextDueOf(lastSale.order), lastSale.order.currency) }}</p>
                <select v-model="abonoMethod" class="lumia-field-input">
                  <option value="cash">Efectivo</option>
                  <option value="bank_transfer">Transferencia</option>
                </select>
                <input
                  v-if="abonoMethod === 'cash'"
                  v-model.number="abonoReceived"
                  type="number"
                  min="0"
                  step="0.01"
                  class="lumia-field-input"
                  placeholder="Efectivo recibido"
                />
                <input
                  v-else
                  v-model="abonoReference"
                  type="text"
                  class="lumia-field-input"
                  placeholder="Referencia / comprobante"
                />
              </div>
              <p v-if="abonoError" class="mt-2 text-xs text-rose-600">{{ abonoError }}</p>
              <BaseButton class="mt-2" variant="secondary" :disabled="abonoSubmitting" @click="registerAbono">
                {{ abonoSubmitting ? 'Registrando…' : 'Registrar abono' }}
              </BaseButton>
            </div>
            <BaseButton
              v-if="lastSale.order.paymentStatus !== 'paid' && can('orders.update')"
              variant="secondary"
              @click="openConfirmDialog"
            >
              Cobrar saldo
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
          Venta {{ lastSale?.order.receiptNumber }} — saldo {{ formatPrice(lastSale ? balanceOf(lastSale.order) : 0, lastSale?.order.currency ?? 'COP') }}
        </p>
        <p class="mt-1 text-xs text-lumia-ink/50">
          Método: {{ methodLabel(lastSale?.order.paymentMethod ?? '') }}. La confirmación registra quién verificó el pago y cuándo.
        </p>

        <div v-if="lastSale?.order.paymentMethod === 'cash'" class="mt-4 space-y-3">
          <div>
            <label class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Importe recibido</label>
            <input v-model.number="confirmCashReceived" type="number" min="0" step="0.01" class="lumia-field-input mt-1" />
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-lumia-ink/60">Cambio</span>
            <span class="font-medium" :class="confirmChange < 0 ? 'text-rose-600' : 'text-lumia-ink'">
              {{ formatPrice(Math.max(0, confirmChange), lastSale?.order.currency ?? 'COP') }}
            </span>
          </div>
          <p
            v-if="confirmCashReceived !== null && lastSale && confirmCashReceived < nextDueOf(lastSale.order)"
            class="text-xs text-rose-600"
          >
            El importe recibido no puede ser inferior al saldo pendiente.
          </p>
        </div>

        <div v-if="lastSale?.order.paymentMethod === 'bank_transfer'" class="mt-4 space-y-3">
          <p class="text-xs text-lumia-ink/60">
            Confirma solo después de verificar que el dinero ingresó en la cuenta del establecimiento.
          </p>
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
          <BaseButton :disabled="confirming || !canConfirmPayment" @click="confirmPayment">
            {{ confirming ? 'Confirmando…' : 'Cobrar saldo' }}
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconPackage, IconSearch, IconShoppingCartPlus, IconX } from '@tabler/icons-vue'
import PosProductPagination from '~/features/pos/components/PosProductPagination.vue'
import ProductThumbnail from '~/components/product/ProductThumbnail.vue'
import type {
  PosBankTransferDetails,
  PosPaymentMethod,
  PosPaymentStatus,
  PosProduct,
  PosProductVariant,
  PosCustomer,
  PosCartItem,
  PosSaleResult,
} from '#shared/types/pos'

definePageMeta({ layout: 'admin', middleware: 'pos' })

const { formatPrice } = useUtils()
const toast = useToast()
const { user, can } = useAuth()
const {
  getPaymentMethods,
  searchProducts: apiSearchProducts,
  searchCustomers: apiSearchCustomers,
  createSale,
  confirmPayment: confirmPaymentApi,
} = usePosApi()

const paymentMethods = ref<PosPaymentMethod[]>([])
const bankTransferDetails = ref<PosBankTransferDetails | null>(null)
const paymentMethod = ref('cash')
const paymentState = ref<PosPaymentStatus>('pending_manual')


const cart = ref<PosCartItem[]>([])

const discountAmount = ref(0)
const notes = ref('')

const customerMode = ref<'walk_in' | 'existing'>('walk_in')
const walkInName = ref('')
const walkInPhone = ref('')
const walkInEmail = ref('')
const customerSearch = ref('')
const customersLoading = ref(false)
/** Last term that returned a response, used to show the "no matches" state. */
const customerSearchDone = ref('')
const customerResults = ref<PosCustomer[]>([])
const selectedCustomer = ref<PosCustomer | null>(null)

const cashReceived = ref<number | null>(null)
const transferReference = ref('')

/** Límite de importes que acepta el servidor de POS (cashReceived, changeGiven, discountAmount). */
const POS_MAX_AMOUNT = 9_999_999
const POS_MAX_AMOUNT_LABEL = '9.999.999'

/** Traduce errores de validación del servidor a un mensaje en español en lugar de mostrar el genérico. */
function posApiErrorMessage(e: unknown, fallback: string): string {
  const err = e as { data?: { message?: string; details?: { fieldErrors?: Record<string, string[]> } } }
  const fieldErrors = err?.data?.details?.fieldErrors
  const messages = fieldErrors ? Object.values(fieldErrors).flat() : []
  if (messages.some((m) => m.includes('less than or equal'))) {
    return `Un importe supera el máximo permitido (${POS_MAX_AMOUNT_LABEL}). Revisa efectivo, cambio o descuento.`
  }
  if (messages.length) return 'Revisa los datos de la venta e intenta de nuevo.'
  return err?.data?.message || fallback
}

const isSubmitting = ref(false)
const submitError = ref('')
const lastSale = ref<PosSaleResult | null>(null)

/** Saldo que falta por cobrar de una venta (G3). Sin dato del servidor: total si no está pagada. */
function balanceOf(order: { total: number; paymentStatus: string; balanceDue?: number }): number {
  if (typeof order.balanceDue === 'number') return order.balanceDue
  return order.paymentStatus === 'paid' ? 0 : order.total
}

/** Importe exacto que se cobra ahora: el anticipo pendiente, o el saldo completo si el anticipo ya está pagado. */
function nextDueOf(order: { total: number; paymentStatus: string; balanceDue?: number; nextPaymentRequired?: number }): number {
  if (typeof order.nextPaymentRequired === 'number') return order.nextPaymentRequired
  return balanceOf(order)
}

// Abono parcial sobre la venta en curso (G3): importe, método y datos de verificación.
const abonoAmount = ref<number | null>(null)
const abonoMethod = ref<'cash' | 'bank_transfer'>('cash')
const abonoReceived = ref<number | null>(null)
const abonoReference = ref('')
const abonoSubmitting = ref(false)
const abonoError = ref('')
// Clave de idempotencia: un reintento del mismo abono no vuelve a cobrar (pérdida de conexión).
let abonoKey: { fingerprint: string; key: string } | null = null
const idempotencyKey = ref(crypto.randomUUID())

const confirmDialogOpen = ref(false)
const confirmCashReceived = ref<number | null>(null)
const confirmTransferReference = ref('')
const confirmNote = ref('')
const confirming = ref(false)
const confirmError = ref('')

onMounted(async () => {
  try {
    // The server is the only source of enabled methods. Never show a local fallback: a method
    // the server does not enable would be offered and then rejected on submit.
    const res = await getPaymentMethods()
    paymentMethods.value = res.methods
    bankTransferDetails.value = res.bankTransferDetails
    syncPaymentSelection()
  } catch (e: unknown) {
    paymentMethods.value = []
    bankTransferDetails.value = null
    syncPaymentSelection()
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message ?? 'No se pudieron cargar los métodos de pago configurados')
  }
})

const selectedMethod = computed(() =>
  paymentMethods.value.find((method) => method.methodId === paymentMethod.value) ?? null,
)
const selectedMethodSupportsPaid = computed(() => selectedMethod.value?.supportsPaid ?? false)

watch(paymentMethod, () => {
  if (!selectedMethodSupportsPaid.value) paymentState.value = 'pending_manual'
})

const subtotal = computed(() => cart.value.reduce((s, l) => s + l.unitPrice * l.quantity, 0))
const currency = computed(() => cart.value[0]?.currency ?? 'COP')
const total = computed(() => Math.max(0, subtotal.value - (discountAmount.value || 0)))
const discountError = computed(() => {
  const value = discountAmount.value || 0
  if (value < 0) return 'El descuento no puede ser negativo.'
  if (value > subtotal.value) return 'El descuento no puede superar el subtotal.'
  return ''
})
const hasMixedCurrency = computed(() => new Set(cart.value.map((line) => line.currency)).size > 1)
const cashShortfall = computed(
  () => paymentMethod.value === 'cash' && cashReceived.value !== null && cashReceived.value < total.value,
)
const change = computed(() => {
  if (cashReceived.value === null) return 0
  return cashReceived.value - total.value
})
const confirmChange = computed(() => {
  if (!lastSale.value || confirmCashReceived.value === null) return 0
  return confirmCashReceived.value - nextDueOf(lastSale.value.order)
})
const canSubmit = computed(() => {
  if (!cart.value.length || hasMixedCurrency.value || discountError.value) return false
  if (!selectedMethod.value) return false
  if (paymentMethod.value === 'cash' && paymentState.value === 'paid') {
    if (cashReceived.value === null || cashReceived.value < total.value) return false
  }
  return true
})
const canConfirmPayment = computed(() => {
  if (!lastSale.value) return false
  if (lastSale.value.order.paymentMethod === 'cash') {
    if (confirmCashReceived.value === null) return false
    return confirmCashReceived.value >= nextDueOf(lastSale.value.order)
  }
  return true
})

function syncPaymentSelection() {
  if (!paymentMethods.value.find((method) => method.methodId === paymentMethod.value)) {
    paymentMethod.value = paymentMethods.value[0]?.methodId ?? ''
  }
  if (!selectedMethodSupportsPaid.value) paymentState.value = 'pending_manual'
}

function selectPaymentMethod(methodId: string) {
  paymentMethod.value = methodId
  // Selecting a method never confirms payment by itself.
  if (!paymentMethods.value.find((method) => method.methodId === methodId)?.supportsPaid) {
    paymentState.value = 'pending_manual'
  }
}

const productSearchInput = ref('')
const submittedQuery = ref('')
const hasSearched = ref(false)
const productsLoading = ref(false)
const productsError = ref('')
const productResults = ref<PosProduct[]>([])
const productPage = ref(1)
const productPageSize = ref(10)
const productTotal = ref(0)
const productTotalPages = ref(1)
let productRequestSeq = 0

async function runProductSearch(page: number) {
  const term = submittedQuery.value
  if (!term) return
  // Only the latest request may update the view; older responses are ignored.
  const seq = ++productRequestSeq
  productsLoading.value = true
  productsError.value = ''
  try {
    const res = await apiSearchProducts(term, page, productPageSize.value)
    if (seq !== productRequestSeq) return
    productResults.value = res.products
    productTotal.value = res.total
    productTotalPages.value = res.totalPages
    productPage.value = res.page
  } catch (e: unknown) {
    if (seq !== productRequestSeq) return
    const err = e as { data?: { message?: string } }
    productResults.value = []
    productsError.value = err?.data?.message ?? 'No se pudieron cargar los productos. Intenta de nuevo.'
  } finally {
    if (seq === productRequestSeq) productsLoading.value = false
  }
}

function submitProductSearch() {
  const term = productSearchInput.value.trim().replace(/\s+/g, ' ')
  if (!term) return
  // Same term already loading: do not send a duplicate request.
  if (term === submittedQuery.value && productsLoading.value) return
  submittedQuery.value = term
  hasSearched.value = true
  void runProductSearch(1)
}

function goToProductPage(page: number) {
  if (page < 1 || page > productTotalPages.value || page === productPage.value) return
  if (productsLoading.value) return
  void runProductSearch(page)
}

function changeProductPageSize(size: number) {
  if (size === productPageSize.value) return
  productPageSize.value = size
  void runProductSearch(1)
}

function clearProductSearch() {
  productRequestSeq++
  productSearchInput.value = ''
  submittedQuery.value = ''
  hasSearched.value = false
  productsLoading.value = false
  productsError.value = ''
  productResults.value = []
  productPage.value = 1
  productTotal.value = 0
  productTotalPages.value = 1
}

/** Estado de stock para la vista: agotado, bajo, normal o sin control de inventario. */
function stockLevel(variant: PosProductVariant): 'out' | 'low' | 'ok' | 'na' {
  if (!variant.tracked || variant.isPerOrder) return 'na'
  if (variant.available <= 0) return 'out'
  if (variant.available <= LOW_STOCK_THRESHOLD) return 'low'
  return 'ok'
}

function stockClass(variant: PosProductVariant): string {
  const level = stockLevel(variant)
  if (level === 'out') return 'text-rose-600'
  if (level === 'low') return 'text-amber-700'
  if (level === 'ok') return 'text-emerald-700'
  return 'text-lumia-ink/60'
}

function stockDotClass(variant: PosProductVariant): string {
  const level = stockLevel(variant)
  if (level === 'out') return 'bg-rose-500'
  if (level === 'low') return 'bg-amber-500'
  if (level === 'ok') return 'bg-emerald-500'
  return 'bg-lumia-ink/30'
}

async function searchCustomers() {
  const term = customerSearch.value.trim().replace(/\s+/g, ' ')
  if (!term) {
    customerResults.value = []
    customerSearchDone.value = ''
    return
  }
  customersLoading.value = true
  try {
    const res = await apiSearchCustomers(term, 10)
    customerResults.value = res.customers
    customerSearchDone.value = term
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message ?? 'Error al buscar clientes')
  } finally {
    customersLoading.value = false
  }
}

/** Variant chosen per product in the catalog. Single-variant products resolve to their only variant. */
const PRODUCT_PAGE_SIZE_OPTIONS = [10, 20, 50]
/** Umbral visual de stock bajo para el POS (presentación, no regla de inventario del servidor). */
const LOW_STOCK_THRESHOLD = 5

const selectedSkus = ref<Record<string, string>>({})

function selectedSku(product: PosProduct): string | null {
  if (product.variants.length === 1) return product.variants[0]?.sku ?? null
  return selectedSkus.value[product.id] ?? null
}

function productVariant(product: PosProduct): PosProductVariant | null {
  const sku = selectedSku(product)
  return product.variants.find((variant) => variant.sku === sku) ?? null
}

function selectVariant(product: PosProduct, sku: string) {
  selectedSkus.value = { ...selectedSkus.value, [product.id]: sku }
}

function minPrice(product: PosProduct): number {
  return Math.min(...product.variants.map((variant) => variant.price))
}

/** Untracked variants (no inventory record) and per-order variants are sold without a stock limit. */
function isSellable(variant: PosProductVariant): boolean {
  return !variant.tracked || variant.isPerOrder || variant.available > 0
}

function stockText(variant: PosProductVariant, short = false): string {
  if (variant.isPerOrder) return short ? 'Por pedido' : 'Bajo pedido'
  if (!variant.tracked) return short ? 'Disponible' : 'Sin control de inventario'
  if (variant.available <= 0) return 'Agotado'
  return short ? 'En stock' : `${variant.available} unidades`
}

function canIncrement(line: PosCartItem): boolean {
  return !line.tracked || line.isPerOrder || line.quantity < line.available
}

function addProductToCart(product: PosProduct) {
  const variant = productVariant(product)
  if (!variant) {
    toast.error('Selecciona una presentación antes de agregar el producto')
    return
  }
  addToCart(product, variant)
}

function addToCart(product: PosProduct, variant: PosProductVariant) {
  if (!isSellable(variant)) {
    toast.error(`${product.name} (${variant.label}) no tiene existencias disponibles`)
    return
  }
  const existing = cart.value.find((l) => l.sku === variant.sku)
  if (existing) {
    if (!canIncrement(existing)) {
      toast.error(`Stock insuficiente para ${existing.name}: disponible ${existing.available}`)
      return
    }
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
      available: variant.available,
    })
  }
}

function increment(sku: string) {
  const line = cart.value.find((l) => l.sku === sku)
  if (!line) return
  if (!canIncrement(line)) {
    toast.error(`Stock insuficiente para ${line.name}: disponible ${line.available}`)
    return
  }
  line.quantity += 1
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
      ? selectedCustomer.value.source === 'counter'
        ? { mode: 'existing', posCustomerId: selectedCustomer.value.id }
        : { mode: 'existing', userId: selectedCustomer.value.id }
      : {
          mode: 'walk_in',
          name: walkInName.value.trim() || undefined,
          phone: walkInPhone.value.trim() || undefined,
          email: walkInEmail.value.trim() || undefined,
        }

  // Method and state travel as separate fields; selecting a method never implies paid.
  const effectiveState: PosPaymentStatus = selectedMethodSupportsPaid.value
    ? paymentState.value
    : 'pending_manual'

  const payment: Record<string, unknown> = {
    method: paymentMethod.value,
    state: effectiveState,
  }
  if (paymentMethod.value === 'cash' && effectiveState === 'paid') {
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
  if (cashReceived.value !== null && cashReceived.value > POS_MAX_AMOUNT) {
    submitError.value = `El efectivo recibido no puede superar ${POS_MAX_AMOUNT_LABEL}.`
    return
  }
  if (discountAmount.value > POS_MAX_AMOUNT) {
    submitError.value = `El descuento no puede superar ${POS_MAX_AMOUNT_LABEL}.`
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
    submitError.value = posApiErrorMessage(e, 'No se pudo registrar la venta')
    toast.error(submitError.value)
  } finally {
    isSubmitting.value = false
  }
}

function receiptUrl(sale: PosSaleResult) {
  return sale.receiptUrl.startsWith('http') ? sale.receiptUrl : sale.receiptUrl
}

function statusLabel(status: string) {
  return paymentStatusLabel(status)
}

function methodLabel(methodId: string) {
  const method = paymentMethods.value.find((item) => item.methodId === methodId)
  if (method) return method.displayName
  if (methodId === 'cash') return 'Efectivo'
  if (methodId === 'bank_transfer') return 'Transferencia bancaria'
  return methodId
}

function paymentEventLabel(type: string) {
  if (type === 'payment.manual_pending') return 'Pendiente de pago manual'
  if (type === 'payment.manual_confirmed') return 'Pagado'
  return type
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function confirmationActorLabel(actorId: string) {
  if (user.value?.id && user.value.id === actorId) return 'ti'
  return `admin ${actorId.slice(-6)}`
}

function openConfirmDialog() {
  if (!lastSale.value) return
  confirmCashReceived.value = lastSale.value.order.cashReceived ?? nextDueOf(lastSale.value.order)
  confirmTransferReference.value = lastSale.value.order.transferReference ?? ''
  confirmNote.value = ''
  confirmError.value = ''
  confirmDialogOpen.value = true
}

/** Registra un abono parcial en la venta actual. El servidor valida importe, saldo y referencia. */
async function registerAbono() {
  if (!lastSale.value) return
  abonoError.value = ''
  const order = lastSale.value.order
  // Importe exacto: el anticipo completo o, ya pagado el anticipo, el saldo completo.
  const amount = nextDueOf(order)
  if (!(amount > 0)) {
    abonoError.value = 'No hay importe pendiente por cobrar.'
    return
  }
  const payload: Record<string, unknown> = { method: abonoMethod.value, amount }
  if (abonoMethod.value === 'cash') {
    if (abonoReceived.value === null || abonoReceived.value < amount) {
      abonoError.value = 'El efectivo recibido no puede ser inferior al abono.'
      return
    }
    payload.receivedAmount = abonoReceived.value
  } else {
    if (!abonoReference.value.trim()) {
      abonoError.value = 'La transferencia requiere la referencia bancaria.'
      return
    }
    payload.transferReference = abonoReference.value.trim()
  }

  // Misma operación reintentada → misma clave; cambio de importe, método o referencia → clave nueva.
  const fingerprint = `${order.id}|${JSON.stringify(payload)}`
  if (!abonoKey || abonoKey.fingerprint !== fingerprint) {
    abonoKey = { fingerprint, key: crypto.randomUUID() }
  }
  payload.idempotencyKey = abonoKey.key

  abonoSubmitting.value = true
  try {
    const summary = await $fetch<{ paidAmount: number; balanceDue: number; paymentStatus: string; status: string }>(
      `/api/admin/orders/${encodeURIComponent(order.id)}/payments`,
      { method: 'POST', body: payload },
    )
    abonoKey = null
    lastSale.value.order = {
      ...order,
      paidAmount: summary.paidAmount,
      balanceDue: summary.balanceDue,
      paymentStatus: summary.paymentStatus,
      status: summary.status,
    }
    abonoAmount.value = null
    abonoReceived.value = null
    abonoReference.value = ''
    toast.success('Abono registrado')
  } catch (e: unknown) {
    abonoError.value = posApiErrorMessage(e, 'No se pudo registrar el abono')
  } finally {
    abonoSubmitting.value = false
  }
}

async function confirmPayment() {
  if (!lastSale.value || !canConfirmPayment.value) return
  confirming.value = true
  confirmError.value = ''
  try {
    const payload: Record<string, unknown> = { note: confirmNote.value.trim() || undefined }
    const balance = nextDueOf(lastSale.value.order)
    if (lastSale.value.order.paymentMethod === 'cash') {
      if (confirmCashReceived.value === null || confirmCashReceived.value < balance) {
        confirmError.value = 'El importe recibido en efectivo no puede ser inferior al saldo pendiente'
        return
      }
      if (confirmCashReceived.value > POS_MAX_AMOUNT) {
        confirmError.value = `El efectivo recibido no puede superar ${POS_MAX_AMOUNT_LABEL}`
        return
      }
      payload.cashReceived = confirmCashReceived.value
      payload.changeGiven = Math.max(0, confirmCashReceived.value - balance)
    }
    if (lastSale.value.order.paymentMethod === 'bank_transfer') {
      payload.transferReference = confirmTransferReference.value.trim() || undefined
    }
    const updated = await confirmPaymentApi(lastSale.value.order.id, payload)
    lastSale.value.order = updated
    toast.success('Pago confirmado')
    confirmDialogOpen.value = false
  } catch (e: unknown) {
    confirmError.value = posApiErrorMessage(e, 'No se pudo confirmar el pago')
  } finally {
    confirming.value = false
  }
}

function resetForm() {
  lastSale.value = null
  abonoAmount.value = null
  abonoReceived.value = null
  abonoReference.value = ''
  abonoError.value = ''
  cart.value = []
  discountAmount.value = 0
  notes.value = ''
  cashReceived.value = null
  transferReference.value = ''
  idempotencyKey.value = crypto.randomUUID()
}
</script>