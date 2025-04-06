// js/ui.js

const UIService = {
    // Store references to frequently used elements
    elements: {
        filterToggle: document.getElementById('filterToggle'), // Keep if filter dropdown mechanism is used
        filterDropdown: document.getElementById('filterDropdown'), // Keep if filter dropdown mechanism is used
        imageModal: document.getElementById('myModal'),          // Use the ID from main.js/index.html
        modalImage: document.getElementById('modal-image'),     // Use the ID from main.js/index.html
        modalCloseBtn: document.getElementById('myModal')?.querySelector('.close-button'), // Use the ID from main.js/index.html
        copySuccessMsg: document.getElementById('copySuccessMessage'), // Keep if copy success UI exists
        logo: document.querySelector('.logo a'), // More specific selector for logo link
        dateRange: document.getElementById('date-range'),     // Keep if date range display exists
        // Removed: eventsContainer, loadingMessage, noEventsMessage (handled in main.js)
        copyrightYear: document.getElementById('copyright-year'),
        // Removed: calendarIcon, calendarPopup
    },

    // State
    isFilterDropdownOpen: false, // Keep if using the filter toggle mechanism

    init() {
        // Check for essential modal elements if they are expected
        if (!this.elements.imageModal) {
            console.warn("Warning: Image modal element not found.");
        }
        this.setupEventListeners();
        this.updateCopyrightYear();
        // this.updateDateRange(); // Remove if date range display is removed from HTML
        console.log("UI Service Initialized (Deals Focus)");
    },

    setupEventListeners() {
        // --- Filter Toggle (Keep if using this specific dropdown toggle) ---
        if (this.elements.filterToggle && this.elements.filterDropdown) {
            this.elements.filterToggle.addEventListener('click', () => this.toggleFilterDropdown());
            document.addEventListener('click', (event) => { /* Keep outside click logic */ });
            document.addEventListener('keydown', (e) => { /* Keep escape key logic */ });
        } else {
            // console.warn("Filter toggle/dropdown elements missing (may be handled differently).");
        }

        // --- Image Modal Close ---
        // Re-select close button potentially added dynamically, or rely on main.js delegation
        this.elements.modalCloseBtn = this.elements.imageModal?.querySelector('.close-button');
        if (this.elements.modalCloseBtn) {
             this.elements.modalCloseBtn.addEventListener('click', () => this.closeImageModal());
        }
        if (this.elements.imageModal) {
            this.elements.imageModal.addEventListener('click', (e) => {
                if (e.target === this.elements.imageModal) this.closeImageModal();
            });
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.elements.imageModal.style.display === "block") { // Check if visible
                    this.closeImageModal();
                }
            });
        } else {
             console.warn("Image modal element not fully found for close listeners.");
        }

        // --- Share Button Dropdowns (Keep if share buttons exist on cards) ---
        document.body.addEventListener('click', (event) => {
            const shareButton = event.target.closest('.share-button'); // Ensure cards have '.share-button'
            // ... (keep existing logic for opening/closing share dropdown) ...
             if (!shareButton) {
                 document.querySelectorAll('.share-button.active').forEach(btn => btn.classList.remove('active'));
                 return;
             }
            const shareOption = event.target.closest('.share-option');
             if (!shareOption) {
                 const currentlyActive = shareButton.classList.contains('active');
                 document.querySelectorAll('.share-button.active').forEach(btn => {
                     if (btn !== shareButton) btn.classList.remove('active');
                 });
                 shareButton.classList.toggle('active', !currentlyActive);
             }
        });

        // --- Handle Share Option Clicks (Updated for Deals) ---
        document.body.addEventListener('click', (event) => {
            const shareOption = event.target.closest('.share-option'); // Ensure share options have this class
            if (!shareOption) return;

            event.stopPropagation();

            const platform = shareOption.dataset.platform;
            const dealId = shareOption.dataset.id; // Assuming share options have data-id="dealId"
            const parentShareButton = shareOption.closest('.share-button');

            // *** Use global DEAL data store ***
            const dealData = window.allDealsData?.find(deal => deal && deal.id == dealId); // Use == for potential type mismatch

            if (dealData) {
                const dealTitle = dealData.name || "Check out this deal!"; // Use deal name
                // Construct a URL for the specific deal if possible, otherwise use main page or deal link
                const dealUrl = dealData.link || `https://khojum.com/deal/${dealId}` || window.location.href; // Example URL structure
                this.handleShare(platform, dealTitle, dealUrl);
            } else {
                console.error("Share failed: Deal data not found for ID:", dealId);
                alert("Could not get deal details to share.");
            }

            parentShareButton?.classList.remove('active'); // Close dropdown
        });

        // --- Khojum Logo Click ---
        this.elements.logo?.addEventListener('click', (e) => {
            // Prevent default if it's inside something else, ensure it navigates
            // e.preventDefault(); // Usually not needed unless it's doing something else
            window.location.href = '/';
         });

        // --- WhatsApp Discount Button (Keep if button exists with this action) ---
        document.body.addEventListener('click', (event) => {
            const button = event.target.closest('.filter-button[data-action="whatsapp-discount"]');
            if (button) this.openWhatsAppForDiscount();
        });
    },

    // --- Filter Dropdown Methods (Keep if using toggle) ---
    toggleFilterDropdown() { if (this.isFilterDropdownOpen) this.closeFilterDropdown(); else this.openFilterDropdown(); },
    openFilterDropdown() { if (this.elements.filterToggle && this.elements.filterDropdown) { this.elements.filterDropdown.hidden = false; this.elements.filterToggle.setAttribute('aria-expanded', 'true'); this.isFilterDropdownOpen = true; this.elements.filterDropdown.querySelector('button, select')?.focus(); } },
    closeFilterDropdown() { if (this.elements.filterToggle && this.elements.filterDropdown) { this.elements.filterDropdown.hidden = true; this.elements.filterToggle.setAttribute('aria-expanded', 'false'); this.isFilterDropdownOpen = false; } },

    // --- Image Modal Methods (Keep - called by main.js delegation) ---
    openImageModal(imageUrl, altText = "Expanded deal image") { // Updated alt text
        if (this.elements.imageModal && this.elements.modalImage && imageUrl) {
            this.elements.modalImage.src = imageUrl;
            this.elements.modalImage.alt = altText;
            this.elements.imageModal.style.display = "block"; // Use style.display consistent with main.js
            this.elements.modalCloseBtn?.focus();
            document.body.classList.add('modal-open'); // Add scroll lock here too
        } else {
            console.error("Cannot open image modal, elements or URL missing.");
        }
    },
    closeImageModal() {
        if (this.elements.imageModal) {
            this.elements.imageModal.style.display = "none";
            this.elements.modalImage.src = "";
            document.body.classList.remove('modal-open'); // Remove scroll lock
        }
    },

    // --- Static UI Updates ---
    updateCopyrightYear() {
        if (this.elements.copyrightYear) {
            this.elements.copyrightYear.textContent = new Date().getFullYear();
        }
    },
    updateDateRange() { // Keep if #date-range exists in HTML
        if (this.elements.dateRange) {
            // (Date range logic remains the same - customize if needed)
            const now = new Date();
            const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
            const startDate = new Date(now);
            // Adjust to start of the week (e.g., Sunday)
            startDate.setDate(now.getDate() - dayOfWeek);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6); // End of the week (Saturday)

            const options = { month: 'short', day: 'numeric' }; // Use short month
            const rangeString = `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}, ${endDate.getFullYear()}`;
            this.elements.dateRange.textContent = rangeString;
        }
    },

    // --- Loading/Error/No Results Messages (REMOVED - Handled in main.js) ---
    // showLoadingMessage(show = true) { ... } // Removed
    // showNoDealsMessage(show = true, message = 'No deals found...') { ... } // Renamed and kept if preferred
    showNoDealsMessage(show = true, message = 'No deals found matching your criteria.') {
        const noDealsElem = document.getElementById('no-deals-message'); // Assume this ID exists if using this
        if (noDealsElem) {
            noDealsElem.textContent = message;
            noDealsElem.style.display = show ? 'block' : 'none';
        }
    },
    // showFetchError(message) { ... } // Removed


    // --- Share Functionality (Updated for Deals) ---
    handleShare(platform, title, url) {
        console.log(`Sharing on ${platform}: ${title} - ${url}`);
        let shareUrl = '';
        const encodedTitle = encodeURIComponent(title);
        const encodedUrl = encodeURIComponent(url);

        switch (platform) {
            case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${encodedTitle}%20-%20${encodedUrl}`; break;
            case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`; break;
            case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`; break;
            case 'copy': this.copyToClipboard(url); this.showCopySuccess(); return;
            case 'instagram': this.copyToClipboard(url); alert('Link copied! Open Instagram and paste it.'); return;
            default: console.warn(`Unknown share platform: ${platform}`); return;
        }
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    },
    copyToClipboard(text) { /* Keep existing logic */
        navigator.clipboard.writeText(text).then(() => { console.log('Async: Copied'); }).catch(err => { console.error('Async: Could not copy: ', err); try { const textArea = document.createElement("textarea"); textArea.value = text; textArea.style.position = "fixed"; textArea.style.opacity = "0"; document.body.appendChild(textArea); textArea.focus(); textArea.select(); document.execCommand('copy'); document.body.removeChild(textArea); console.log('Fallback: Copied'); } catch (fallbackErr) { console.error('Fallback failed:', fallbackErr); alert('Failed to copy link.'); } });
    },
    showCopySuccess() { /* Keep existing logic */
        if (this.elements.copySuccessMsg) { this.elements.copySuccessMsg.classList.add('show'); setTimeout(() => { this.elements.copySuccessMsg.classList.remove('show'); }, 2500); }
    },

    // --- Misc Helpers ---
    openWhatsAppForDiscount() { /* Keep existing logic */
        const phoneNumber = "9779861828821"; const message = "Hi Khojum! I'm interested in getting a discount code."; const url = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`; window.open(url, "_blank", 'noopener,noreferrer');
    },

    // --- Removed Event Specific Functions ---
    // updateEventTimeCounter(...) - Removed
    // parseEventDateTime(...) - Removed

};

// Initialize the UI service when the script loads
UIService.init();