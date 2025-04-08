// Make data accessible globally (rename for clarity)
window.allDealsData = [];


// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    console.log("Main script for TOURIST EXPERIENCES loaded (Final Version).");

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
    let currentSort = 'rating-desc'; // Default sort for tourist experiences

    // --- Functions ---

    /**
     * Fetches experience data from deals.json. 
     * Note: You may want to rename this file to experiences.json in the future
     */
    async function fetchDeals() {
        console.log("Fetching tourist experiences from deals.json...");
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
                dealsGridContainer.innerHTML = '<p style="text-align: center; color: var(--light-text);">No experiences available at the moment.</p>';
            } else {
                console.log("Experiences fetched successfully:", window.allDealsData.length, "items");
                renderDeals(); // Initial render ONLY if data was fetched successfully
                // renderFeaturedItems(); // Call if you have a featured section
            }

        } catch (error) {
            console.error("Failed to fetch or process experiences:", error);
            dealsGridContainer.innerHTML = `<p style="color: red; text-align: center;">Failed to load experiences. Please check connection or data source. (${error.message})</p>`;
            window.allDealsData = []; // Set to empty on error
        } finally {
            loadingIndicator.style.display = 'none'; // Hide loading
        }
    }

    const words = [
        "Discounts & Offers",
        "Find Best Local Foods",
        "Places to Go",
        "Hidden Temples",
        "Peaceful Nature Spots",
        "Cheap Hotels",
        "Local Experiences"
      ];
    
      const rotatingText = document.getElementById("rotating-text");
      let index = 0;
    
      setInterval(() => {
        rotatingText.classList.remove("fade-in");
        rotatingText.classList.add("fade-out");
    
        setTimeout(() => {
          index = (index + 1) % words.length;
          rotatingText.textContent = words[index];
          rotatingText.classList.remove("fade-out");
          rotatingText.classList.add("fade-in");
        }, 400); // Wait for fade-out to finish
      }, 3000); // Rotate every 3 seconds
    
    /**
     * Renders experiences based on current filters and sorting.
     */
    function renderDeals() {
        console.log(`Rendering experiences with filter: ${currentFilter}, sort: ${currentSort}`);
        dealsGridContainer.innerHTML = ''; // Clear grid

        let filteredDeals = window.allDealsData;

        // 1. Filter - Using tourist categories
        if (currentFilter !== 'all') {
            filteredDeals = window.allDealsData.filter(deal => deal && deal.category === currentFilter);
        }

        // Ensure filteredDeals is an array before sorting
        if (!Array.isArray(filteredDeals)) {
            console.error("Filtered data is not an array!", filteredDeals);
            filteredDeals = []; // Prevent sorting error
        }

        // 2. Sort - Updated for tourist experiences
        filteredDeals.sort((a, b) => {
            // Add checks for potentially undefined properties
            const now = new Date();
            const dateAddedA = a?.dateAdded ? new Date(a.dateAdded) : new Date(0);
            const dateAddedB = b?.dateAdded ? new Date(b.dateAdded) : new Date(0);
            const priceA = a?.price ?? a?.originalPrice ?? Infinity;
            const priceB = b?.price ?? b?.originalPrice ?? Infinity;
            const priceADesc = a?.price ?? a?.originalPrice ?? -1;
            const priceBDesc = b?.price ?? b?.originalPrice ?? -1;
            const ratingA = a?.rating ?? 0;
            const ratingB = b?.rating ?? 0;
            const popularityA = a?.popularity ?? 0;
            const popularityB = b?.popularity ?? 0;
            const distanceA = a?.distanceFromCenter ?? Infinity;
            const distanceB = b?.distanceFromCenter ?? Infinity;

            switch (currentSort) {
                case 'rating-desc':
                    return ratingB - ratingA;
                case 'popularity-desc':
                    return popularityB - popularityA;
                case 'price-asc':
                    return priceA - priceB;
                case 'price-desc':
                    return priceBDesc - priceADesc;
                case 'distance-asc':
                    return distanceA - distanceB;
                case 'newest':
                    return dateAddedB - dateAddedA;
                default:
                    return 0;
            }
        });

        // 3. Create HTML and Append
        if (filteredDeals.length === 0) {
            dealsGridContainer.innerHTML = '<p style="text-align: center; color: var(--light-text);">No experiences match the current filter/sort.</p>';
            return;
        }

        filteredDeals.forEach(deal => {
            const card = createDealCard(deal);
            if (card) dealsGridContainer.appendChild(card);
        });

        // Re-initialize relevant listeners for dynamic content
        addDescriptionScrollListeners();
    }

    /**
     * Creates an HTML element for a single experience card.
     */
    function createDealCard(deal) {
        // Basic validation of the deal object
        if (!deal || typeof deal !== 'object' || !deal.id || !deal.name) {
            console.warn("Skipping invalid/incomplete experience data:", deal);
            return null;
        }

        const card = document.createElement('div');
        card.classList.add('event-card');
        card.dataset.category = deal.category || 'unknown';
        card.dataset.dealId = deal.id;

        // For tourist experiences, we'll display duration instead of expiry
        let durationText = 'Duration: N/A';
        let durationClass = '';
        
        if (deal.duration) {
            durationText = `Duration: ${deal.duration}`;
            durationClass = 'experience-duration';
        }

        // Card HTML - Updated for Tourist Experiences
        const imageUrl = deal.imageUrl || '/assets/images/experience-placeholder.jpg';
        const categoryDisplay = deal.category || 'Experience';
        const ratingDisplay = deal.rating ? 
            `<span class="experience-rating"><i class="fas fa-star"></i> ${deal.rating}/5</span>` : '';
        const locationDisplay = deal.location ? 
            `<span class="event-location"><i class="fas fa-map-marker-alt"></i> ${deal.location}</span>` : '';
        const descriptionDisplay = deal.description ? 
            `<div class="event-description"><p>${deal.description}</p><span class="scroll-indicator" style="display: none;">▼</span></div>` : '';

        let priceDisplay = 'Check Price';
        if (deal.price !== null && deal.price !== undefined) {
            priceDisplay = `NPR ${deal.price}`;
            if (deal.originalPrice && deal.price < deal.originalPrice) {
                priceDisplay += ` <span class="original-price"> NPR ${deal.originalPrice}</span>`;
            }
        }
        const priceClass = (deal.price === 0) ? 'free' : '';

        card.innerHTML = `
            <div class="event-image" style="background-image: url('${imageUrl}');" data-img-src="${imageUrl}">
                <span class="event-category">${categoryDisplay}</span>
                <div class="expand-image-icon" title="Expand Image"><i class="fas fa-expand"></i></div>
            </div>
            <div class="event-content">
                <h3 class="event-title">${deal.name}</h3>
                <div class="event-meta">
                    ${ratingDisplay}
                    <span class="deal-duration ${durationClass}"><i class="fas fa-clock"></i> ${durationText}</span>
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
     * Opens the modal with tourist experience details or image.
     */
     function openModal(imageUrl = null, dealDetails = null) {
         if (!modal || !modalImage || !modalDetails || !modalCloseButton) {
             console.error("Modal elements missing, cannot open.");
             return;
         }
        try {
            if (imageUrl) {
                modalImage.src = imageUrl;
                modalImage.alt = dealDetails?.name || 'Expanded experience image';
                modalImage.style.display = 'block';
                modalDetails.style.display = 'none';
            } else if (dealDetails) {
                modalImage.style.display = 'none';
                modalDetails.style.display = 'block';

                const durationText = dealDetails.duration || 'N/A';
                let priceInfo = 'Check Price';
                if (dealDetails.price !== null && dealDetails.price !== undefined) {
                    priceInfo = `NPR ${dealDetails.price}`;
                    if(dealDetails.originalPrice && typeof dealDetails.originalPrice === 'number' && dealDetails.price < dealDetails.originalPrice) {
                        priceInfo += ` <span class="original-price" style="text-decoration: line-through; color: grey; font-size: 0.9em;">NPR ${dealDetails.originalPrice}</span>`;
                    }
                } else if (dealDetails.originalPrice) {
                     priceInfo = `<span style="text-decoration: line-through; color: grey;">Was NPR ${dealDetails.originalPrice}</span>`;
                }

                // Display tourist-specific details
                modalDetails.innerHTML = `
                    <h3>${dealDetails.name || 'Experience Details'}</h3>
                    <p><strong>Category:</strong> ${dealDetails.category || 'N/A'}</p>
                    ${dealDetails.rating ? `<p><strong>Rating:</strong> ${dealDetails.rating}/5 ${dealDetails.reviewCount ? `(${dealDetails.reviewCount} reviews)` : ''}</p>` : ''}
                    <p><strong>Duration:</strong> ${durationText}</p>
                    <p><strong>Price:</strong> ${priceInfo}</p>
                    ${dealDetails.location ? `<p><strong>Location:</strong> ${dealDetails.location}</p>` : ''}
                    ${dealDetails.distanceFromCenter ? `<p><strong>Distance from City Center:</strong> ${dealDetails.distanceFromCenter} km</p>` : ''}
                    <hr style="margin: 10px 0; border: none; border-top: 1px solid var(--c-border);">
                    <p style="white-space: pre-wrap;">${dealDetails.description || 'No description available.'}</p>
                    ${dealDetails.highlights ? `
                    <h4 style="margin-top: 15px;">Highlights</h4>
                    <ul style="padding-left: 20px;">
                        ${Array.isArray(dealDetails.highlights) ? dealDetails.highlights.map(highlight => `<li>${highlight}</li>`).join('') : ''}
                    </ul>` : ''}
                    ${dealDetails.link ? `<p style="margin-top: 15px;"><a href="${dealDetails.link.startsWith('http') ? dealDetails.link : '//' + dealDetails.link}" target="_blank" rel="noopener noreferrer" class="event-button" style="display: inline-block; padding: 8px 15px; background-color: var(--c-primary); color: white; text-decoration: none; border-radius: 5px;">Book Now <i class="fas fa-external-link-alt" style="font-size: 0.8em; margin-left: 5px;"></i></a></p>` : ''}
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
                           const dealData = window.allDealsData.find(d => d && d.id === dealId);
                           openModal(imgSrc, dealData);
                      }
                      return;
                 }

                 if (detailsButton) {
                      const dealId = detailsButton.dataset.dealId;
                      console.log("Details requested (delegated):", dealId);
                      const dealData = window.allDealsData.find(deal => deal && deal.id === dealId);
                      if (dealData) openModal(null, dealData);
                      else console.error("Experience data not found (delegated):", dealId);
                      return;
                 }
             });
         } else { console.warn("Experiences grid container #events-grid-container not found."); }

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
style.textContent = `
body.modal-open { overflow: hidden; }
.experience-rating { color: #ffb100; }
.experience-duration { color: #0a84ff; }
`;
document.head.appendChild(style);
