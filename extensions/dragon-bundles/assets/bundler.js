document.addEventListener('DOMContentLoaded', async function () {
  const App_Domain = 'https://replies-hammer-timber-cohen.trycloudflare.com';
  const dealsWrapper = document.getElementById('deals-wrapper');

  if (!dealsWrapper) {
    console.error('❌ Deals wrapper element not found in DOM');
    return;
  }

  // Get shop domain from data attribute (preferred) or fallback to Shopify.shop
  let shop = dealsWrapper.getAttribute('data-shop') || (typeof Shopify !== 'undefined' && Shopify.shop) || '';

  if (!shop) {
    console.error('❌ Shop domain not found. Cannot fetch deals.');
    dealsWrapper.innerHTML = '<div class="no-deals">Error: Shop domain not available.</div>';
    return;
  }

  console.log('🔍 Shop:', shop, 'Fetching bundle deals...');

  // Show loading state
  dealsWrapper.innerHTML = '<div class="loading-deals">Loading all bundle deals...</div>';

  try {
    // Fetch all deals from API
    console.log(`Fetching all bundles for shop: ${shop}`);
    const response = await fetch(`${App_Domain}/api/deals/${shop}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch deals: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API Response:', data);

    if (!data.ok || !data.deals || data.deals.length === 0) {
      if (dealsWrapper) {
        dealsWrapper.innerHTML = '<div class="no-deals">No active bundle deals available at the moment.</div>';
      }
      console.log('No deals found');
      return;
    }

    console.log(`Found ${data.deals.length} bundle deal(s). Rendering all bundles...`);

    // Render all deals with product cards
    const dealsHTML = data.deals
      .map(
        (deal, index) => {
          const products = deal.products || [];
          const goalQuantity = deal.goalQuantity;
          const goalAmount = deal.goalAmount;
          const goalType = deal.goalType;

          // Build discount banner text (used in pill + summary)
          let discountBannerText = deal.discountText || '';
          if (goalQuantity && goalType === 'quantity') {
            discountBannerText = `${deal.discountText || '€3 discount'} on ${goalQuantity} items`;
          } else if (goalAmount && goalType === 'amount_cart') {
            discountBannerText = `${deal.discountText || 'Discount'} on ${goalAmount}+ cart`;
          }

          // Build a human readable quantity / amount summary for bottom CTA
          const itemsCount =
            goalType === 'quantity' && goalQuantity
              ? `${goalQuantity} items`
              : `${products.length} items`;

          const amountSummary =
            goalType === 'amount_cart' && goalAmount
              ? `Min. cart ${goalAmount}`
              : '';

          return `
        <div class="deal-item">
          ${products.length > 0 ? `
          <div class="bundle-products-section">
            <div class="products-slider-container">
              <div class="products-slider-wrapper">
                ${products.map((product, pIndex) => `
                  <div class="product-card" data-product-id="${product.id}" data-variant-id="${product.variantId || ''}">
                    <div class="product-image-wrapper">
                      <img src="${product.image || 'https://via.placeholder.com/300'}" alt="${product.title}" class="product-image" />
                      <div class="product-badge">For new customers only</div>
                    </div>
                    <div class="product-info">
                      <h3 class="product-title">${product.title}</h3>
                      <div class="product-price">
                        <span class="current-price">${product.formattedPrice}</span>
                        <span class="original-price">${product.formattedOriginalPrice}</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
              <button class="slider-nav prev-nav" aria-label="Previous products">‹</button>
              <button class="slider-nav next-nav" aria-label="Next products">›</button>
            </div>
            <!-- Bottom bundle summary + CTA -->
            <div class="bundle-bottom-bar">
              <div class="bundle-bottom-info">
                <div class="bundle-bottom-discount">${discountBannerText}</div>
                <div class="bundle-bottom-meta">
                  <span class="bundle-bottom-items">${itemsCount}</span>
                  ${amountSummary ? `<span class="bundle-bottom-dot">•</span><span class="bundle-bottom-amount">${amountSummary}</span>` : ''}
                </div>
              </div>
              <div class="bundle-actions">
                <button class="purchase-bundle-btn" 
                        data-deal-id="${deal.id}" 
                        data-goal-quantity="${goalQuantity || ''}"
                        data-goal-amount="${goalAmount || ''}"
                        data-goal-type="${goalType || ''}"
                        data-products='${JSON.stringify(products)}'>
                  Add bundle to cart
                </button>
              </div>
            </div>            
          </div>
          ` : '<div class="no-products">No products available in this bundle.</div>'}
        </div>
      `;
        }
      )
      .join('');

    // Build main header discount text from the first deal (used in pill at top)
    const firstDeal = data.deals[0];
    let mainDiscountText = firstDeal?.discountText || '';
    if (firstDeal) {
      if (firstDeal.goalQuantity && firstDeal.goalType === 'quantity') {
        mainDiscountText = `${firstDeal.discountText || '€3 discount'} on ${firstDeal.goalQuantity} items`;
      } else if (firstDeal.goalAmount && firstDeal.goalType === 'amount_cart') {
        mainDiscountText = `${firstDeal.discountText || 'Discount'} on ${firstDeal.goalAmount}+ cart`;
      }
    }

    // Render all bundles to the page, wrapped with header + layout that matches design
    if (dealsWrapper) {
      dealsWrapper.innerHTML = `
        <section class="bundle-deals-section">
          <div class="bundle-deals-header">
            <h2 class="bundle-deals-title">Bundle deals</h2>
            <button class="bundle-deals-pill" type="button">
              <span class="bundle-deals-pill-icon">🧺</span>
              <span class="bundle-deals-pill-text">${mainDiscountText || 'Special discount on bundle items'}</span>
              <span class="bundle-deals-pill-arrow">›</span>
            </button>
          </div>
          <div class="bundle-deals-list">
            ${dealsHTML}
          </div>
        </section>
      `;

      // Initialize slider functionality and purchase button handlers
      initializeBundleFeatures();

      console.log(`✅ Successfully rendered ${data.deals.length} bundle deal(s) on the page`);
    } else {
      console.error('Deals wrapper element not found in DOM');
    }
  } catch (error) {
    console.error('Error loading bundle deals:', error);
    if (dealsWrapper) {
      dealsWrapper.innerHTML = '<div class="no-deals">Unable to load bundle deals. Please try again later.</div>';
    }
  }

  // Initialize slider and purchase button functionality
  function initializeBundleFeatures() {
    // Initialize product sliders
    document.querySelectorAll('.products-slider-container').forEach((container) => {
      const wrapper = container.querySelector('.products-slider-wrapper');
      const prevBtn = container.querySelector('.prev-nav');
      const nextBtn = container.querySelector('.next-nav');

      if (!wrapper || !prevBtn || !nextBtn) return;

      let scrollPosition = 0;
      const scrollAmount = 320; // Width of one product card + gap

      prevBtn.addEventListener('click', () => {
        scrollPosition = Math.max(0, scrollPosition - scrollAmount);
        wrapper.scrollTo({ left: scrollPosition, behavior: 'smooth' });
      });

      nextBtn.addEventListener('click', () => {
        const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
        scrollPosition = Math.min(maxScroll, scrollPosition + scrollAmount);
        wrapper.scrollTo({ left: scrollPosition, behavior: 'smooth' });
      });

      // Update nav buttons visibility
      const updateNavButtons = () => {
        const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
        prevBtn.style.display = scrollPosition > 0 ? 'flex' : 'none';
        nextBtn.style.display = scrollPosition < maxScroll ? 'flex' : 'none';
      };

      wrapper.addEventListener('scroll', () => {
        scrollPosition = wrapper.scrollLeft;
        updateNavButtons();
      });

      updateNavButtons();
    });

    // Initialize Purchase Bundle buttons
    document.querySelectorAll('.purchase-bundle-btn').forEach((btn) => {
      btn.addEventListener('click', async function () {
        const dealId = this.getAttribute('data-deal-id');
        const goalQuantity = this.getAttribute('data-goal-quantity');
        const goalAmount = this.getAttribute('data-goal-amount');
        const goalType = this.getAttribute('data-goal-type');
        const productsData = this.getAttribute('data-products');

        if (!productsData) {
          console.error('No products data found');
          return;
        }

        const products = JSON.parse(productsData);

        if (!products || products.length === 0) {
          alert('No products available in this bundle.');
          return;
        }

        // Disable button and show loading
        this.disabled = true;
        const originalText = this.textContent;
        this.textContent = 'Adding to cart...';

        try {
          // Filter products that have variant IDs
          const validProducts = products.filter(p => p.variantId);

          if (validProducts.length === 0) {
            throw new Error('No products with valid variant IDs found');
          }

          // Calculate quantities based on goal
          let quantities = [];
          if (goalType === 'quantity' && goalQuantity) {
            // Add products to meet the goal quantity
            const goalQty = parseInt(goalQuantity);
            const productsNeeded = Math.min(goalQty, validProducts.length);

            // Distribute quantity across products
            const qtyPerProduct = Math.ceil(goalQty / productsNeeded);
            quantities = validProducts.slice(0, productsNeeded).map((_, index) => {
              if (index === productsNeeded - 1) {
                // Last product gets remaining quantity
                const remaining = goalQty - (qtyPerProduct * (productsNeeded - 1));
                return Math.max(1, remaining);
              }
              return qtyPerProduct;
            });
          } else if (goalType === 'amount_cart' && goalAmount) {
            // For amount-based goals, add products until we reach the goal
            // For now, add 1 of each product
            quantities = validProducts.map(() => 1);
          } else {
            // Default: add 1 of each product
            quantities = validProducts.map(() => 1);
          }

          // Add products to cart sequentially to avoid conflicts
          const results = [];
          for (let i = 0; i < validProducts.length && i < quantities.length; i++) {
            const product = validProducts[i];
            const quantity = quantities[i];

            try {
              // Extract numeric variant ID if it's in GID format
              let variantId = product.variantId;
              if (typeof variantId === 'string' && variantId.includes('/')) {
                variantId = variantId.split('/').pop();
              }

              const response = await fetch('/cart/add.js', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({
                  id: variantId,
                  quantity: quantity
                })
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.description || `Failed to add ${product.title}`);
              }

              const result = await response.json();
              results.push({ success: true, product: product.title, result });

              // Small delay between additions
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
              console.error(`Error adding ${product.title}:`, error);
              results.push({ success: false, product: product.title, error: error.message });
            }
          }

          // Check if at least one product was added successfully
          const successfulAdds = results.filter(r => r.success);
          const failedAdds = results.filter(r => !r.success);

          if (successfulAdds.length === 0) {
            throw new Error('Failed to add any products to cart');
          }

          // Fire custom event so other parts of the theme/app (e.g. rewards) can react
          try {
            document.dispatchEvent(
              new CustomEvent('dragonbundle:bundle-purchased', {
                detail: {
                  dealId,
                  goalType,
                  goalQuantity,
                  goalAmount,
                  products: validProducts,
                  successfulAdds,
                  failedAdds
                }
              })
            );
          } catch (eventError) {
            console.warn('Could not dispatch dragonbundle:bundle-purchased event', eventError);
          }

          // Refresh cart and trigger events
          document.dispatchEvent(new CustomEvent('cart:updated'));

          // Wait a bit for cart to update
          await new Promise(resolve => setTimeout(resolve, 500));

          // Open cart drawer if available
          try {
            const cartDrawer = document.querySelector('cart-drawer') || document.querySelector('.cart-drawer');
            if (cartDrawer) {
              if (typeof cartDrawer.open === 'function') {
                cartDrawer.open();
              } else if (typeof cartDrawer.show === 'function') {
                cartDrawer.show();
              }
            }
          } catch (drawerError) {
            console.log('Could not open cart drawer:', drawerError);
          }

          // Show success message
          if (failedAdds.length > 0) {
            this.textContent = `Added ${successfulAdds.length} item(s)! ✓`;
            console.warn('Some products failed to add:', failedAdds);
          } else {
            this.textContent = 'Added to Cart! ✓';
          }

          this.style.background = '#28a745';

          setTimeout(() => {
            this.disabled = false;
            this.textContent = originalText;
            this.style.background = '';
          }, 3000);

        } catch (error) {
          console.error('Error adding bundle to cart:', error);
          alert('Failed to add bundle to cart. Please try again.');
          this.disabled = false;
          this.textContent = originalText;
        }
      });
    });
  }
});