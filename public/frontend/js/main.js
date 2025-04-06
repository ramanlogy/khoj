// Make data accessible globally (rename for clarity)
window.allDealsData = [];


// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    console.log("Main script for DEALS loaded (Final Version).");

    // --- DOM Elements ---
    const dealsGridContainer = document.getElementById('events-grid-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const filterButtonsContainer = document.getElementById('filter-buttons-container');
    const sortDealsSelect = document.getElementById('sort-deals');
    const copyrightYearSpan = document.getElementById('current-year');
    const currentDateDisplay = document.getElementById('current-date-display');
    // const featuredContainer = document.getElementById('featured-events-container'); // Uncomment if needed

    // Modal elements
    const modal = document.getElementById('myModal');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalImage = document.getElementById('modal-image');
    const modalDetails = document.getElementById('modal-details');

    // --- Check Core Elements ---
    if (!dealsGridContainer || !loadingIndicator || !filterButtonsContainer || !sortDealsSelect || !modal) {
        console.error("CRITICAL ERROR: One or more essential UI elements not found. Aborting script.");
        alert("Page initialization failed. Check console.");
        return;
    }

    // --- State ---
    let currentFilter = 'all';
    let currentSort = 'expiry-asc'; // Default sort for deals

    // --- Functions ---

    /**
     * Fetches DEAL data from deals.json.
     */
    async function fetchDeals() {
        console.log("Fetching deals from deals.json...");
        loadingIndicator.style.display = 'block';
        dealsGridContainer.innerHTML = ''; // Clear grid

        try {
            const response = await fetch('/frontend/deals.json'); // Path relative to HTML file
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                 throw new Error(`Expected JSON but received ${contentType}`);
            }

            const fetchedData = await response.json();
            window.allDealsData = fetchedData || []; // Assign fetched data, default to empty array

            if (!Array.isArray(window.allDealsData)) {
                 console.warn("Fetched data is not an array:", window.allDealsData);
                 window.allDealsData = []; // Ensure it's an array
                 throw new Error("Invalid data format received from server.");
            }

            if (window.allDealsData.length === 0) {
                console.warn("Fetched data is empty.");
                dealsGridContainer.innerHTML = '<p style="text-align: center; color: var(--light-text);">No deals available at the moment.</p>';
            } else {
                console.log("Deals fetched successfully:", window.allDealsData.length, "items");
                renderDeals(); // Initial render ONLY if data was fetched successfully
                // renderFeaturedItems(); // Call if you have a featured section
            }

        } catch (error) {
            console.error("Failed to fetch or process deals:", error);
            dealsGridContainer.innerHTML = `<p style="color: red; text-align: center;">Failed to load deals. Please check connection or data source. (${error.message})</p>`;
            window.allDealsData = []; // Set to empty on error
        } finally {
            loadingIndicator.style.display = 'none'; // Hide loading
        }
    }

    /**
     * Renders deals based on current filters and sorting.
     */
    function renderDeals() {
        console.log(`Rendering deals with filter: ${currentFilter}, sort: ${currentSort}`);
        dealsGridContainer.innerHTML = ''; // Clear grid

        let filteredDeals = window.allDealsData;

        // 1. Filter
        if (currentFilter !== 'all') {
            filteredDeals = window.allDealsData.filter(deal => deal && deal.category === currentFilter); // Add check for deal existence
        }

        // Ensure filteredDeals is an array before sorting
         if (!Array.isArray(filteredDeals)) {
             console.error("Filtered data is not an array!", filteredDeals);
             filteredDeals = []; // Prevent sorting error
         }


        // 2. Sort
        filteredDeals.sort((a, b) => {
            // Add checks for potentially undefined properties
            const now = new Date();
            const expiryA = a?.expiryDate ? new Date(a.expiryDate) : new Date('9999-12-31');
            const expiryB = b?.expiryDate ? new Date(b.expiryDate) : new Date('9999-12-31');
            const dateAddedA = a?.dateAdded ? new Date(a.dateAdded) : new Date(0);
            const dateAddedB = b?.dateAdded ? new Date(b.dateAdded) : new Date(0);
            const discountA = a?.discountPercentage ?? 0;
            const discountB = b?.discountPercentage ?? 0;
            const priceA = a?.price ?? a?.originalPrice ?? Infinity; // Default high for asc sort
            const priceB = b?.price ?? b?.originalPrice ?? Infinity;
            const priceADesc = a?.price ?? a?.originalPrice ?? -1; // Default low for desc sort
            const priceBDesc = b?.price ?? b?.originalPrice ?? -1;


            switch (currentSort) {
                case 'expiry-asc':
                    return expiryA - expiryB;
                case 'discount-desc':
                    return discountB - discountA;
                case 'price-asc':
                    return priceA - priceB;
                case 'price-desc':
                    return priceBDesc - priceADesc;
                case 'newest':
                    return dateAddedB - dateAddedA;
                default:
                    return 0;
            }
        });

        // 3. Create HTML and Append
        if (filteredDeals.length === 0) {
             dealsGridContainer.innerHTML = '<p style="text-align: center; color: var(--light-text);">No deals match the current filter/sort.</p>';
             return;
        }

        filteredDeals.forEach(deal => {
            const card = createDealCard(deal);
            if (card) dealsGridContainer.appendChild(card); // Only append if card creation succeeded
        });

        // Re-initialize relevant listeners for dynamic content
        addDescriptionScrollListeners();
        // Image zoom and details button listeners are handled by delegation now
    }

    /**
     * Creates an HTML element for a single DEAL card.
     */
    function createDealCard(deal) {
        // Basic validation of the deal object
         if (!deal || typeof deal !== 'object' || !deal.id || !deal.name) {
             console.warn("Skipping invalid/incomplete deal data:", deal);
             return null; // Return null if essential data is missing
         }

        const card = document.createElement('div');
        card.classList.add('event-card'); // Base class (consider renaming)
        card.dataset.category = deal.category || 'unknown';
        card.dataset.dealId = deal.id;

        const expiryDate = deal.expiryDate ? new Date(deal.expiryDate) : null;
        const now = new Date();
        let expiryText = 'No Expiry Date';
        let expiryStatusClass = '';

        if (expiryDate && !isNaN(expiryDate.getTime())) { // Check if date is valid
            const expiryDay = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
            const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (expiryDay < todayDay) {
                expiryText = 'Expired';
                expiryStatusClass = 'expired-deal';
            } else {
                 const diffTime = expiryDate - now;
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                 const displayDays = Math.max(0, diffDays);

                 if (displayDays === 0) {
                      expiryText = 'Expires Today';
                      expiryStatusClass = 'expiring-soon';
                 } else {
                     expiryText = `Expires in ${displayDays} day${displayDays !== 1 ? 's' : ''}`;
                     if (displayDays <= 3) {
                         expiryStatusClass = 'expiring-soon';
                     }
                 }
            }
        }

        // ** THE FIX IS HERE: Only add class if non-empty **
        if (expiryStatusClass) {
            card.classList.add(expiryStatusClass);
        }

        // --- Card HTML - Updated for Deals ---
        const imageUrl = deal.imageUrl || '/assets/images/deal-placeholder.jpg'; // Default image
        const categoryDisplay = deal.category || 'Deal';
        const discountBadge = deal.discountPercentage ? `<span class="event-category discount-badge">${deal.discountPercentage}% OFF</span>` : `<span class="event-category">${categoryDisplay}</span>`;
        const storeDisplay = deal.store ? `<span class="deal-store"><i class="fas fa-store"></i> ${deal.store}</span>` : '';
        const locationDisplay = deal.location ? `<span class="event-location"><i class="fas fa-map-marker-alt"></i> ${deal.location}</span>` : '';
        const descriptionDisplay = deal.description ? `<div class="event-description"><p>${deal.description}</p><span class="scroll-indicator" style="display: none;">▼</span></div>` : '';

        let priceDisplay = 'Check Store';
        if (deal.price !== null && deal.price !== undefined) {
            priceDisplay = `NPR ${deal.price}`;
            if (deal.originalPrice && deal.price < deal.originalPrice) {
                priceDisplay += ` <span class="original-price"> NPR ${deal.originalPrice}</span>`;
            }
        } else if (deal.originalPrice) {
             priceDisplay = `Was NPR ${deal.originalPrice}`;
        }
        const priceClass = (deal.price === 0) ? 'free' : '';


        card.innerHTML = `
            <div class="event-image" style="background-image: url('${imageUrl}');" data-img-src="${imageUrl}">
                ${discountBadge}
                <div class="expand-image-icon" title="Expand Image"><i class="fas fa-expand"></i></div>
            </div>
            <div class="event-content">
                <h3 class="event-title">${deal.name}</h3>
                <div class="event-meta">
                    ${storeDisplay}
                     <span class="deal-expiry ${expiryStatusClass}"><i class="fas fa-calendar-times"></i> ${expiryText}</span>
                     ${locationDisplay}
                 </div>
                ${descriptionDisplay}
                <div class="event-footer">
                    <span class="event-price-tag ${priceClass}">${priceDisplay}</span>
                    <button class="event-button details-button" data-deal-id="${deal.id}">Details</button>
                </div>
            </div>
        `;
        return card;
    }

    /**
     * Updates the active state of filter buttons.
     */
    function updateFilterButtons() {
        if (!filterButtonsContainer) return;
        const buttons = filterButtonsContainer.querySelectorAll('.filter-button');
        buttons.forEach(button => {
            if (button.dataset.filter === currentFilter) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    /**
     * Adds scroll listeners to descriptions.
     */
     function addDescriptionScrollListeners() {
         if (!dealsGridContainer) return;
        const descriptions = dealsGridContainer.querySelectorAll('.event-description');
        descriptions.forEach(desc => {
            const p = desc.querySelector('p');
            const indicator = desc.querySelector('.scroll-indicator');
            if (!p || !indicator) return;

            // Use ResizeObserver for more reliable scroll detection changes
            const resizeObserver = new ResizeObserver(() => checkScroll(p, indicator));
            resizeObserver.observe(p);

            checkScroll(p, indicator); // Initial check

            if (!desc.dataset.scrollListenerAdded) {
                 p.addEventListener('scroll', () => checkScroll(p, indicator), { passive: true });
                 desc.dataset.scrollListenerAdded = 'true';
             }
        });
     }

     /** Helper for description scroll check */
     function checkScroll(paragraphElement, indicatorElement) {
         if (!paragraphElement || !indicatorElement) return;
         try {
            const isScrollable = paragraphElement.scrollHeight > paragraphElement.clientHeight + 1; // +1 for tolerance
            indicatorElement.style.display = isScrollable ? 'block' : 'none';
            if (isScrollable) {
                const isAtBottom = paragraphElement.scrollHeight - paragraphElement.scrollTop <= paragraphElement.clientHeight + 5; // 5px threshold
                indicatorElement.style.opacity = isAtBottom ? '0' : '1';
            } else {
                indicatorElement.style.opacity = '0'; // Hide if not scrollable
            }
         } catch (e) {
             console.warn("Error checking scroll:", e);
             indicatorElement.style.display = 'none'; // Hide indicator on error
         }
     }

    /**
     * Opens the modal, optionally with an image or DEAL details.
     */
     function openModal(imageUrl = null, dealDetails = null) {
         if (!modal || !modalImage || !modalDetails || !modalCloseButton) {
             console.error("Modal elements missing, cannot open.");
             return;
         }
        try {
            if (imageUrl) {
                modalImage.src = imageUrl;
                modalImage.alt = dealDetails?.name || 'Expanded deal image';
                modalImage.style.display = 'block';
                modalDetails.style.display = 'none';
            } else if (dealDetails) {
                modalImage.style.display = 'none';
                modalDetails.style.display = 'block';

                const expiryDate = dealDetails.expiryDate ? new Date(dealDetails.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
                let priceInfo = 'Check Store';
                if (dealDetails.price !== null && dealDetails.price !== undefined) {
                    priceInfo = `NPR ${dealDetails.price}`;
                    if(dealDetails.originalPrice && typeof dealDetails.originalPrice === 'number' && dealDetails.price < dealDetails.originalPrice) {
                        priceInfo += ` <span class="original-price" style="text-decoration: line-through; color: grey; font-size: 0.9em;">NPR ${dealDetails.originalPrice}</span>`;
                    }
                } else if (dealDetails.originalPrice) {
                     priceInfo = `<span style="text-decoration: line-through; color: grey;">Was NPR ${dealDetails.originalPrice}</span>`;
                }

                modalDetails.innerHTML = `
                    <h3>${dealDetails.name || 'Deal Details'}</h3>
                    <p><strong>Store/Brand:</strong> ${dealDetails.store || 'N/A'}</p>
                    <p><strong>Category:</strong> ${dealDetails.category || 'N/A'}</p>
                    ${dealDetails.discountPercentage ? `<p><strong>Discount:</strong> ${dealDetails.discountPercentage}% OFF</p>` : ''}
                    <p><strong>Price:</strong> ${priceInfo}</p>
                    <p><strong>Expires:</strong> ${expiryDate}</p>
                    ${dealDetails.location ? `<p><strong>Location:</strong> ${dealDetails.location}</p>` : ''}
                    <hr style="margin: 10px 0; border: none; border-top: 1px solid var(--c-border);">
                    <p style="white-space: pre-wrap;">${dealDetails.description || 'No description available.'}</p>
                     ${dealDetails.link ? `<p style="margin-top: 15px;"><a href="${dealDetails.link.startsWith('http') ? dealDetails.link : '//' + dealDetails.link}" target="_blank" rel="noopener noreferrer" class="event-button" style="display: inline-block; padding: 8px 15px; background-color: var(--c-primary); color: white; text-decoration: none; border-radius: 5px;">Visit Store/Offer <i class="fas fa-external-link-alt" style="font-size: 0.8em; margin-left: 5px;"></i></a></p>` : ''}
                 `;
            } else {
                console.error("Modal opened without valid content.");
                return;
            }
             modal.style.display = "block";
             document.body.classList.add('modal-open');
        } catch (e) {
            console.error("Error opening modal:", e);
            closeModal(); // Attempt to close if error occurs
        }
     }

    /**
     * Closes the modal.
     */
    function closeModal() {
         if (!modal || !modalImage || !modalDetails) return;
        modal.style.display = "none";
        modalImage.src = "";
        modalDetails.innerHTML = "";
         document.body.classList.remove('modal-open');
    }

    /**
     * Updates the copyright year in the footer.
     */
    function updateCopyrightYear() {
        if (copyrightYearSpan) {
            copyrightYearSpan.textContent = new Date().getFullYear();
        }
    }

    /**
     * Updates the current date display in the header.
     */
     function updateCurrentDate() {
         if (currentDateDisplay) {
             try {
                 const now = new Date();
                 const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                 currentDateDisplay.textContent = `Today is ${now.toLocaleDateString('en-US', options)}`;
             } catch (e) {
                 console.error("Error updating date display:", e);
                 currentDateDisplay.textContent = "Error loading date.";
             }
         }
     }

    // --- Utility: Debounce ---
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };


    // --- Event Listeners Setup ---
    function setupEventListeners() {
        console.log("Setting up event listeners...");

        // Filter button clicks
        if (filterButtonsContainer) {
            filterButtonsContainer.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON' && e.target.classList.contains('filter-button')) {
                    currentFilter = e.target.dataset.filter;
                    console.log("Filter changed:", currentFilter);
                    updateFilterButtons();
                    renderDeals();
                }
            });
        } else { console.warn("Filter buttons container not found."); }

        // Sort dropdown change
        if (sortDealsSelect) {
            sortDealsSelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                console.log("Sort changed:", currentSort);
                renderDeals();
            });
        } else { console.warn("Sort dropdown #sort-deals not found."); }

         // Modal close button
         if (modalCloseButton) {
             modalCloseButton.addEventListener('click', closeModal);
         } else { console.warn("Modal close button not found."); }

         // Close modal when clicking outside the content
         if (modal) {
             modal.addEventListener('click', (event) => {
                 if (event.target === modal) closeModal();
             });
         } else { console.warn("Modal element #myModal not found."); }

         // Delegated listeners for dynamic content
         if (dealsGridContainer) {
             dealsGridContainer.addEventListener('click', (e) => {
                 const zoomIcon = e.target.closest('.expand-image-icon');
                 const detailsButton = e.target.closest('.details-button');

                 if (zoomIcon) {
                      e.stopPropagation();
                      const imgContainer = zoomIcon.closest('.event-image');
                      const imgSrc = imgContainer?.dataset.imgSrc;
                      if (imgSrc) {
                          console.log("Zooming image (delegated):", imgSrc);
                           const card = imgContainer.closest('.event-card');
                           const dealId = card?.dataset.dealId;
                           const dealData = window.allDealsData.find(d => d && d.id === dealId); // Add check for d
                           openModal(imgSrc, dealData);
                      }
                      return;
                 }

                 if (detailsButton) {
                      const dealId = detailsButton.dataset.dealId;
                      console.log("Details requested (delegated):", dealId);
                      const dealData = window.allDealsData.find(deal => deal && deal.id === dealId); // Add check for deal
                      if (dealData) openModal(null, dealData);
                      else console.error("Deal data not found (delegated):", dealId);
                      return;
                 }
             });
         } else { console.warn("Deals grid container #events-grid-container not found."); }

         // Close modal with Escape key
         document.addEventListener('keydown', (event) => {
             if (event.key === 'Escape' && modal && modal.style.display === "block") {
                 closeModal();
             }
         });

         console.log("Event listeners attached.");
    }


    // --- Initial Setup ---
    try {
        updateCopyrightYear();
        updateCurrentDate();
        setupEventListeners(); // Setup listeners before fetching data
        fetchDeals(); // Fetch data, which then calls renderDeals
    } catch (initError) {
         console.error("Initialization Error:", initError);
         if (dealsGridContainer) dealsGridContainer.innerHTML = `<p style="color: red; text-align: center;">Page initialization failed. Please try refreshing.</p>`;
         if (loadingIndicator) loadingIndicator.style.display = 'none';
    }

}); // End DOMContentLoaded

// --- Global Helper CSS (Prevent body scroll when modal is open) ---
const style = document.createElement('style');
style.textContent = ` body.modal-open { overflow: hidden; } `;
document.head.appendChild(style);