// js/events.js

const EventService = {
    // DOM Elements
    eventsContainer: document.getElementById('events-container'),
    searchInput: document.getElementById('search-input'),
    searchButton: document.getElementById('search-button'),
    filterButtonsContainer: document.querySelector('.filter-options'), // Container for delegation
    sortDropdown: document.getElementById('sort-options'),
    structuredDataScript: document.getElementById('event-list-structured-data'),

    // State
    currentFilter: 'all',
    currentSort: 'date',
    currentSearchTerm: '',
    allEventsData: [], // Filled by main.js

    init(eventsData) {
        if (!this.eventsContainer) {
            console.error("Events container not found! Cannot initialize EventService.");
            return;
        }
        this.allEventsData = eventsData || [];
        this.loadPreferences(); // Load filter/sort before initial render
        this.setupEventListeners();
        this.applyFiltersAndSort(); // Initial render based on loaded/default preferences
        console.log("Event Service Initialized with", this.allEventsData.length, "events");
    },

    loadPreferences() {
        this.currentFilter = StorageService.load('filter', 'all');
        this.currentSort = StorageService.load('sort', 'date');

        // Apply UI state for preferences
        this.filterButtonsContainer?.querySelectorAll('.filter-button.active').forEach(btn => btn.classList.remove('active'));
        const activeFilterButton = this.filterButtonsContainer?.querySelector(`.filter-button[data-filter="${this.currentFilter}"]`);
        if (activeFilterButton && !activeFilterButton.dataset.action) {
            activeFilterButton.classList.add('active');
        } else {
             this.filterButtonsContainer?.querySelector('.filter-button[data-filter="all"]')?.classList.add('active'); // Fallback to 'all'
             this.currentFilter = 'all'; // Reset state if saved button not found
        }

        if (this.sortDropdown) {
            this.sortDropdown.value = this.currentSort;
             // Handle case where saved sort option might not exist anymore
             if(this.sortDropdown.value !== this.currentSort) {
                 this.currentSort = 'date'; // Default
                 this.sortDropdown.value = 'date';
             }
        }
         console.log("Loaded preferences:", { filter: this.currentFilter, sort: this.currentSort });
    },
    

    setupEventListeners() {
        // Filter Buttons (Delegation)
        this.filterButtonsContainer?.addEventListener('click', (event) => {
            const button = event.target.closest('.filter-button');
            // Only handle filter buttons, ignore action buttons like 'whatsapp-discount'
            if (button && button.dataset.filter && !button.dataset.action) {
                this.currentFilter = button.dataset.filter;
                StorageService.save('filter', this.currentFilter); // Save preference
                this.applyFiltersAndSort();
                // Update active class (handled more robustly in loadPreferences and here)
                 this.filterButtonsContainer.querySelectorAll('.filter-button.active').forEach(btn => btn.classList.remove('active'));
                 button.classList.add('active');
            }
        });

        // Sort Dropdown
        this.sortDropdown?.addEventListener('change', (event) => {
            this.currentSort = event.target.value;
            StorageService.save('sort', this.currentSort); // Save preference
            this.applyFiltersAndSort();
        });

        // Search Input/Button
        const performSearch = () => {
             if (!this.searchInput) return;
             const searchTerm = this.searchInput.value.trim().toLowerCase();
             if (searchTerm !== this.currentSearchTerm) { // Only apply if changed
                 this.currentSearchTerm = searchTerm;
                 this.applyFiltersAndSort();
             }
        };
        this.searchButton?.addEventListener('click', performSearch);
        this.searchInput?.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
        // Optional: Live search with debounce
        let searchTimeout;
        this.searchInput?.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(performSearch, 300); // Debounce search for 300ms
        });

    },

    applyFiltersAndSort() {
         console.log(`Applying filter: ${this.currentFilter}, sort: ${this.currentSort}, search: "${this.currentSearchTerm}"`);
        let filteredEvents = this.filterEvents(this.allEventsData);
        let sortedEvents = this.sortEvents(filteredEvents);
        this.renderEvents(sortedEvents);
        this.updateStructuredData(sortedEvents);
    },

    filterEvents(events) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(todayStart.getDate() + 1);
        const dayAfterTomorrowStart = new Date(todayStart); dayAfterTomorrowStart.setDate(todayStart.getDate() + 2);

        return events.filter(event => {
            const eventDate = UIService.parseEventDateTime(event.date, event.time || '00:00');

            // --- Date Filter ---
            let dateMatch = true;
            if (this.currentFilter === 'today') {
                dateMatch = eventDate && eventDate >= todayStart && eventDate < tomorrowStart;
            } else if (this.currentFilter === 'tomorrow') {
                dateMatch = eventDate && eventDate >= tomorrowStart && eventDate < dayAfterTomorrowStart;
            }

            // --- Category/Price Filter ---
            let categoryMatch = true;
            if (this.currentFilter !== 'all' && this.currentFilter !== 'today' && this.currentFilter !== 'tomorrow') {
                if (this.currentFilter === 'Free') {
                    categoryMatch = typeof event.price === 'string' && event.price.toLowerCase() === 'free';
                } else {
                    categoryMatch = Array.isArray(event.category) &&
                                    event.category.some(cat => cat.toLowerCase() === this.currentFilter.toLowerCase());
                }
            }

            // --- Search Filter ---
            let searchMatch = true;
            if (this.currentSearchTerm) {
                const term = this.currentSearchTerm;
                searchMatch = (
                    event.title?.toLowerCase().includes(term) ||
                    event.description?.toLowerCase().includes(term) ||
                    event.location?.toLowerCase().includes(term) ||
                    (Array.isArray(event.category) && event.category.some(cat => cat.toLowerCase().includes(term)))
                );
            }

            // --- Combine ---
            // If filtering by 'today' or 'tomorrow', only date and search matter.
            if (this.currentFilter === 'today' || this.currentFilter === 'tomorrow') {
                 return dateMatch && searchMatch;
            }
            // Otherwise, category/price and search matter.
            return categoryMatch && searchMatch;
        });
    },

    sortEvents(events) {
        // Use slice() to avoid modifying the original filtered array
        return events.slice().sort((a, b) => {
            // Handle potential invalid dates gracefully
            const dateA = UIService.parseEventDateTime(a.date, a.time || '00:00') || new Date(0);
            const dateB = UIService.parseEventDateTime(b.date, b.time || '00:00') || new Date(0);

            switch (this.currentSort) {
                case 'date': // Default: Sort by Date Ascending
                    return dateA.getTime() - dateB.getTime();
                case 'popularity': // Descending
                    return (b.popularity || 0) - (a.popularity || 0);
                case 'price_asc': // Ascending
                    return this.parsePrice(a.price) - this.parsePrice(b.price);
                case 'price_desc': // Descending
                    return this.parsePrice(b.price) - this.parsePrice(a.price);
                default:
                    return dateA.getTime() - dateB.getTime(); // Fallback to date ascending
            }
        });
    },

    parsePrice(priceString) {
        // (Keep the improved price parsing logic)
        if (typeof priceString !== 'string') return Infinity;
        const lowerCasePrice = priceString.toLowerCase();
        if (lowerCasePrice === 'free') return 0;
        const numbers = lowerCasePrice.match(/\d+/g);
        if (numbers?.length > 0) return parseInt(numbers[0], 10);
        return Infinity; // Treat non-numeric/non-free as highest
    },

    renderEvents(events) {
        if (!this.eventsContainer) return;

        this.eventsContainer.innerHTML = ''; // Clear previous
        UIService.showLoadingMessage(false);

        if (!events || events.length === 0) {
            UIService.showNoEventsMessage(true, `No events found matching "${this.currentSearchTerm || 'your criteria'}".`);
            this.updateStructuredData([]); // Clear structured data too
            return;
        }

        UIService.showNoEventsMessage(false);

        const fragment = document.createDocumentFragment();
        events.forEach(event => {
            const eventCard = this.createEventCard(event);
            fragment.appendChild(eventCard);
        });
        this.eventsContainer.appendChild(fragment);

        // Initialize countdowns for the newly rendered cards
        this.initVisibleCountdownTimers();
    },

    createEventCard(event) {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.dataset.eventId = event.id; // For linking from calendar
        card.id = `event-${event.id}`; // For direct linking/scrolling

        const categoryDisplay = Array.isArray(event.category) ? event.category.join(', ') : (event.category || 'General');
        const imageUrl = event.image || 'assets/placeholder.png'; // Use a placeholder if image missing
        const priceDisplay = event.price || 'N/A';
        const isFree = typeof priceDisplay === 'string' && priceDisplay.toLowerCase() === 'free';
        const eventTitle = event.title || 'Untitled Event';
        const eventDesc = event.description || 'No description available.';
        const eventLocation = event.location || 'Location TBC';
        const eventDate = event.date || 'Date TBC';
        const eventTime = event.time || 'Time TBC';
        const eventUrl = event.url;
        const ticketText = eventUrl ? 'Get Tickets' : 'More Info';
        const urlTarget = eventUrl ? 'target="_blank" rel="noopener noreferrer"' : '';
        const urlDisabled = !eventUrl ? 'aria-disabled="true" style="opacity:0.7; cursor: not-allowed;"' : '';

        card.innerHTML = `
            <div class="event-image" style="background-image: url('${imageUrl}')" role="img" aria-label="Image for ${eventTitle}">
                <button class="expand-image-icon" aria-label="Expand image for ${eventTitle}">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                 </button>
                <div class="event-category">${categoryDisplay}</div>
                <div class="share-button" aria-haspopup="true">
                    <i class="fas fa-share-alt share-icon" aria-hidden="true"></i>
                    <span class="sr-only">Share ${eventTitle}</span>
                    <div class="share-dropdown">
                         <button class="share-option" data-platform="whatsapp" data-id="${event.id}"><i class="fab fa-whatsapp" aria-hidden="true"></i> <span>WhatsApp</span></button>
                         <button class="share-option" data-platform="facebook" data-id="${event.id}"><i class="fab fa-facebook-f" aria-hidden="true"></i> <span>Facebook</span></button>
                         <button class="share-option" data-platform="twitter" data-id="${event.id}"><i class="fab fa-xing" aria-hidden="true"></i> <span>X</span></button>
                         <button class="share-option" data-platform="copy" data-id="${event.id}"><i class="fas fa-link" aria-hidden="true"></i> <span>Copy Link</span></button>
                    </div>
                </div>
            </div>
            <div class="event-content">
                <h3 class="event-title">${eventTitle}</h3>
                <div class="event-meta">
                    <div class="event-date">
                        <i class="far fa-calendar-alt" aria-hidden="true"></i>
                        <span>${eventDate}</span>
                    </div>
                    <div class="event-time">
                        <i class="far fa-clock" aria-hidden="true"></i>
                        <span>${eventTime}</span>
                    </div>
                    <div class="event-location" title="${eventLocation}">
                        <i class="fas fa-map-marker-alt nepal-red" aria-hidden="true"></i>
                        <span>${eventLocation}</span>
                    </div>
                </div>
                <p class="event-description">${eventDesc}</p>
                 <div class="countdown-container">
                     <div class="event-time-counter" id="countdown-${event.id}" data-event-date="${eventDate}" data-event-time="${eventTime}">
                         Calculating status...
                     </div>
                 </div>
                <div class="event-footer">
                    <div class="event-price-tag ${isFree ? 'free' : ''}">
                        ${priceDisplay}
                    </div>
                    <a href="${eventUrl || '#'}" class="event-button" ${urlTarget} ${urlDisabled} title="${eventUrl ? `${ticketText} (opens in new tab)` : 'Tickets not available online'}">
                        ${ticketText} ${eventUrl ? '<i class="fas fa-external-link-alt" aria-hidden="true"></i>' : ''}
                    </a>
                </div>
            </div>
        `;
        

        // Add listeners for image expansion
        const imageDiv = card.querySelector('.event-image');
        const expandButton = card.querySelector('.expand-image-icon');
        expandButton?.addEventListener('click', (e) => {
            e.stopPropagation();
            UIService.openImageModal(imageUrl, `Image for ${eventTitle}`);
        });
        imageDiv?.addEventListener('click', (e) => {
            if (!e.target.closest('.share-button') && !e.target.closest('.expand-image-icon')) {
                UIService.openImageModal(imageUrl, `Image for ${eventTitle}`);
            }
        });

        return card;
    },
    

    initVisibleCountdownTimers() {
        // Call immediately after render, then rely on main interval
        document.querySelectorAll('.event-time-counter').forEach(counterElement => {
            const eventDate = counterElement.dataset.eventDate;
            const eventTime = counterElement.dataset.eventTime;
            UIService.updateEventTimeCounter(counterElement, eventDate, eventTime);
        });
    },

    // Called by main.js interval
    updateVisibleCountdowns() {
        document.querySelectorAll('.event-time-counter').forEach(counterElement => {
            const eventDate = counterElement.dataset.eventDate;
            const eventTime = counterElement.dataset.eventTime;
            UIService.updateEventTimeCounter(counterElement, eventDate, eventTime);
        });
    },

    updateStructuredData(events) {
        if (!this.structuredDataScript) {
             console.warn("Structured data script tag not found.");
             return;
        }

        const itemListElement = events.map((event) => {
            const eventStartDate = UIService.parseEventDateTime(event.date, event.time || '00:00');
            const locationParts = event.location ? event.location.split(',') : ['Kathmandu'];
            const venueName = locationParts[0]?.trim() || event.location || 'Venue TBC';
            // Basic address guessing - enhance if more structured location data is available
            const addressLocality = locationParts.length > 1 ? locationParts[locationParts.length - 2]?.trim() : 'Kathmandu';
            const addressRegion = 'Bagmati'; // Default assumption
            const eventImageUrl = event.image ? new URL(event.image, window.location.origin).href : undefined; // Absolute URL

            let priceValue = null;
            let priceCurrency = "NPR"; // Default
            if (typeof event.price === 'string') {
                if (event.price.toLowerCase() === 'free') {
                    priceValue = "0";
                } else {
                    const numbers = event.price.match(/\d+/g);
                    if (numbers?.length > 0) priceValue = numbers[0];
                    if (event.price.toUpperCase().includes('USD')) priceCurrency = "USD";
                }
            }

            // Base Event Schema
            let schemaEvent = {
                "@type": "Event",
                "name": event.title,
                "description": event.description,
                "url": event.url,
                "eventStatus": "https://schema.org/EventScheduled", // Add logic for cancelled/postponed if data available
                 "organizer": { "@type": "Organization", "name": "Khojum", "url": "https://khojum.com" }
            };

            // Add properties only if they have valid values
            if (eventStartDate && !isNaN(eventStartDate.getTime())) schemaEvent.startDate = eventStartDate.toISOString();
            // Add endDate if available in your data:
            // const eventEndDate = ...;
            // if (eventEndDate && !isNaN(eventEndDate.getTime())) schemaEvent.endDate = eventEndDate.toISOString();
             if (eventImageUrl) schemaEvent.image = eventImageUrl;

             // Location Schema
             schemaEvent.location = {
                 "@type": "Place",
                 "name": venueName,
                 "address": {
                     "@type": "PostalAddress",
                     "addressLocality": addressLocality,
                     "addressRegion": addressRegion,
                     "addressCountry": "NP"
                 }
             };

             // Offer Schema (only if price is known)
             if (priceValue !== null) {
                 schemaEvent.offers = {
                     "@type": "Offer",
                     "price": priceValue,
                     "priceCurrency": priceCurrency,
                     "url": event.url || window.location.href, // Link to event or ticket page
                     "availability": "https://schema.org/InStock" // Or other status
                 };
             }

            return schemaEvent;
        });

        const fullStructuredData = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": itemListElement
        };

        this.structuredDataScript.textContent = JSON.stringify(fullStructuredData, null, 2);
         // console.log("Updated Structured Data:", JSON.stringify(fullStructuredData, null, 2));
    }
};