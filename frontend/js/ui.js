// js/ui.js

const UIService = {
    // Store references to frequently used elements
    elements: {
        filterToggle: document.getElementById('filterToggle'),
        filterDropdown: document.getElementById('filterDropdown'),
        imageModal: document.getElementById('imageModal'),
        modalImage: document.getElementById('modalImage'),
        modalCloseBtn: document.getElementById('imageModal')?.querySelector('.close-modal'), // Might not exist yet
        copySuccessMsg: document.getElementById('copySuccessMessage'),
        logo: document.getElementById('khojum-logo'),
        dateRange: document.getElementById('date-range'),
        eventsContainer: document.getElementById('events-container'),
        loadingMessage: document.getElementById('events-loading-message'),
        noEventsMessage: document.getElementById('no-events-message'),
        copyrightYear: document.getElementById('copyright-year'),
        // Add calendar elements if UI service needs direct access
        calendarIcon: document.getElementById('calendarToggleBtn'),
        calendarPopup: document.getElementById('calendarPopup'),
    },

    // State
    isFilterDropdownOpen: false,

    init() {
        // Check if essential elements exist
        if (!this.elements.eventsContainer) {
            console.error("FATAL: Events container not found. UI cannot initialize properly.");
            return;
        }
        this.setupEventListeners();
        this.updateCopyrightYear();
        this.updateDateRange();
        console.log("UI Service Initialized");
    },

    setupEventListeners() {
        // --- Filter Toggle ---
        if (this.elements.filterToggle && this.elements.filterDropdown) {
            this.elements.filterToggle.addEventListener('click', () => this.toggleFilterDropdown());

            // Close dropdown when clicking outside
            document.addEventListener('click', (event) => {
                if (this.isFilterDropdownOpen &&
                    !this.elements.filterToggle.contains(event.target) &&
                    !this.elements.filterDropdown.contains(event.target)) {
                    this.closeFilterDropdown();
                }
            });
             // Close with Escape key
             document.addEventListener('keydown', (e) => {
                 if (e.key === 'Escape' && this.isFilterDropdownOpen) {
                      this.closeFilterDropdown();
                 }
            });

        } else {
            console.warn("Filter toggle or dropdown elements missing.");
        }

        // --- Image Modal ---
        this.elements.modalCloseBtn = this.elements.imageModal?.querySelector('.close-modal'); // Ensure it's selected after DOM ready
        if (this.elements.imageModal && this.elements.modalImage && this.elements.modalCloseBtn) {
            // Event delegation for opening modal (applied in events.js)
            this.elements.modalCloseBtn.addEventListener('click', () => this.closeImageModal());
            this.elements.imageModal.addEventListener('click', (e) => {
                if (e.target === this.elements.imageModal) this.closeImageModal();
            });
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !this.elements.imageModal.hidden) {
                    this.closeImageModal();
                }
            });
        } else {
            console.warn("Image modal elements not fully found.");
        }

        // --- Share Button Dropdowns (Event Delegation on body) ---
        document.body.addEventListener('click', (event) => {
            const shareButton = event.target.closest('.share-button');
            const shareOption = event.target.closest('.share-option');
            const activeShareButtons = document.querySelectorAll('.share-button.active');

            // If click is NOT on a share button or its option, close all
            if (!shareButton) {
                activeShareButtons.forEach(btn => btn.classList.remove('active'));
                return;
            }

            // If click IS on a share button (but not an option)
            if (!shareOption) {
                const currentlyActive = shareButton.classList.contains('active');
                // Close others first
                activeShareButtons.forEach(btn => {
                    if (btn !== shareButton) btn.classList.remove('active');
                });
                // Toggle current
                shareButton.classList.toggle('active', !currentlyActive);
            }
        });

        // --- Handle Share Option Clicks (Event Delegation on body) ---
        document.body.addEventListener('click', (event) => {
            const shareOption = event.target.closest('.share-option');
            if (!shareOption) return;

            event.stopPropagation(); // Prevent closing dropdown immediately

            const platform = shareOption.dataset.platform;
            const eventId = shareOption.dataset.id;
            const parentShareButton = shareOption.closest('.share-button');

            // Use the global event data store (ensure it's populated by main.js)
            const eventData = window.allEventsData?.find(event => event.id == eventId);

            if (eventData) {
                const eventTitle = eventData.title;
                const eventUrl = eventData.url || window.location.href; // Fallback to page URL
                this.handleShare(platform, eventTitle, eventUrl);
            } else {
                console.error("Share failed: Event data not found for ID:", eventId);
                alert("Could not get event details to share."); // User feedback
            }

            parentShareButton?.classList.remove('active'); // Close dropdown
        });

        // --- Khojum Logo Click ---
        this.elements.logo?.addEventListener('click', () => { window.location.href = '/'; });

        // --- WhatsApp Discount Button (Event Delegation) ---
        document.body.addEventListener('click', (event) => {
            const button = event.target.closest('.filter-button[data-action="whatsapp-discount"]');
            if (button) this.openWhatsAppForDiscount();
        });
    },

    // --- Filter Dropdown Methods ---
    toggleFilterDropdown() {
         if (this.isFilterDropdownOpen) {
              this.closeFilterDropdown();
         } else {
              this.openFilterDropdown();
         }
    },
    openFilterDropdown() {
         if (this.elements.filterToggle && this.elements.filterDropdown) {
              this.elements.filterDropdown.hidden = false;
              this.elements.filterToggle.setAttribute('aria-expanded', 'true');
              this.isFilterDropdownOpen = true;
               // Optional: focus first item in dropdown
               this.elements.filterDropdown.querySelector('button, select')?.focus();
         }
    },
    closeFilterDropdown() {
          if (this.elements.filterToggle && this.elements.filterDropdown) {
              this.elements.filterDropdown.hidden = true;
              this.elements.filterToggle.setAttribute('aria-expanded', 'false');
              this.isFilterDropdownOpen = false;
         }
    },

    // --- Image Modal Methods ---
    openImageModal(imageUrl, altText = "Expanded event image") {
        if (this.elements.imageModal && this.elements.modalImage && imageUrl) {
            this.elements.modalImage.src = imageUrl;
            this.elements.modalImage.alt = altText;
            this.elements.imageModal.hidden = false;
            this.elements.modalCloseBtn?.focus(); // Focus close button for accessibility
        } else {
            console.error("Cannot open image modal, elements or URL missing.");
        }
    },
    closeImageModal() {
        if (this.elements.imageModal) {
            this.elements.imageModal.hidden = true;
            this.elements.modalImage.src = ""; // Clear src to stop loading/free memory
            // Return focus to the element that opened the modal if possible (more advanced)
        }
    },

    // --- Static UI Updates ---
    updateCopyrightYear() {
        if (this.elements.copyrightYear) {
            this.elements.copyrightYear.textContent = new Date().getFullYear();
        }
    },
    updateDateRange() {
        if (this.elements.dateRange) {
            // (Same date range logic as before)
            const now = new Date();
            const dayOfWeek = now.getDay();
            const startDate = new Date(now);
            startDate.setDate(now.getDate() - dayOfWeek);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            const options = { month: 'long', day: 'numeric' };
            const rangeString = `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}, ${endDate.getFullYear()}`;
            this.elements.dateRange.textContent = rangeString;
        }
    },

    // --- Loading/Error/No Results Messages ---
    showLoadingMessage(show = true) {
        if (this.elements.loadingMessage) this.elements.loadingMessage.style.display = show ? 'block' : 'none';
        if (show) this.showNoEventsMessage(false); // Hide no events when loading
    },
    showNoEventsMessage(show = true, message = 'No events found matching your criteria.') {
        if (this.elements.noEventsMessage) {
            this.elements.noEventsMessage.textContent = message;
            this.elements.noEventsMessage.style.display = show ? 'block' : 'none';
        }
    },
    showFetchError(message) {
        // Display a more prominent error if fetching fails
         if (this.elements.eventsContainer) {
             this.elements.eventsContainer.innerHTML = `<p id="fetch-error-message" style="color: red; text-align: center; padding: 40px 20px; grid-column: 1 / -1;">${message}</p>`;
         }
         this.showLoadingMessage(false);
         this.showNoEventsMessage(false);
    },


    // --- Share Functionality ---
    handleShare(platform, title, url) {
        console.log(`Sharing on ${platform}: ${title} - ${url}`);
        let shareUrl = '';
        switch (platform) {
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' - ' + url)}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'twitter': // X
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
                break;
            case 'copy':
                this.copyToClipboard(url);
                this.showCopySuccess();
                return; // Don't open a window for copy
            case 'instagram':
                this.copyToClipboard(url);
                alert('Link copied! Open Instagram and paste it in your story or bio.');
                return; // Don't open a window
            default:
                console.warn(`Unknown share platform: ${platform}`);
                return;
        }
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    },
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Async: Copied to clipboard');
        }).catch(err => {
            console.error('Async: Could not copy text: ', err);
            // Basic fallback
            try {
                 const textArea = document.createElement("textarea");
                 textArea.value = text;
                 textArea.style.position = "fixed"; textArea.style.opacity = "0";
                 document.body.appendChild(textArea);
                 textArea.focus(); textArea.select();
                 document.execCommand('copy');
                 document.body.removeChild(textArea);
                 console.log('Fallback: Copied to clipboard');
             } catch (fallbackErr) {
                 console.error('Fallback failed:', fallbackErr);
                 alert('Failed to copy link automatically. Please copy it manually.');
             }
        });
    },
    showCopySuccess() {
        if (this.elements.copySuccessMsg) {
            this.elements.copySuccessMsg.classList.add('show');
            // Use CSS animation or transition for fade out
            setTimeout(() => { this.elements.copySuccessMsg.classList.remove('show'); }, 2500);
        }
    },

    // --- Misc Helpers ---
    openWhatsAppForDiscount() {
        const phoneNumber = "9779861828821"; // Centralize this maybe
        const message = "Hi Khojum! I'm interested in getting a discount code for an event.";
        const url = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
        window.open(url, "_blank", 'noopener,noreferrer');
    },
    updateEventTimeCounter(element, eventDate, eventTime) {
        // (Same countdown logic as provided in events.js before, but now lives here)
        if (!element || !eventDate || !eventTime) {
             if(element) element.textContent = 'Status N/A'; return;
        }

        const eventDateTime = this.parseEventDateTime(eventDate, eventTime);
        if (!eventDateTime || isNaN(eventDateTime.getTime())) {
            element.textContent = 'Invalid Date';
            element.className = 'event-time-counter expired';
            return;
        }

        const now = new Date();
        const timeDiff = eventDateTime.getTime() - now.getTime();

        // Improved end time: Check if event data has an actual endDate/endTime
        let endTime = null;
        // Assuming event object might have endDate/endTime properties in the future
        // const eventData = window.allEventsData?.find(e => `countdown-${e.id}` === element.id);
        // if (eventData?.endDate && eventData?.endTime) {
        //     endTime = this.parseEventDateTime(eventData.endDate, eventData.endTime);
        // } else if (eventData?.endDate) {
        //     endTime = this.parseEventDateTime(eventData.endDate, "23:59"); // End of day if only date
        // }

        // Simple estimation if no end time available (e.g., 3 hours)
        const estimatedEndTime = endTime || new Date(eventDateTime.getTime() + 3 * 60 * 60 * 1000);

        element.classList.remove('upcoming', 'happening', 'expired');

        if (timeDiff > 0) { // Future
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

            let text = "Starts in ";
            if (days > 1) text += `${days} days`;
            else if (days === 1) text += `${days} day `;
            if (hours > 0 && days < 2) text += `${hours}h `; // Show hours if less than 2 days away
            if (days === 0 && minutes > 0) text += `${minutes}m`; // Show minutes if less than a day away

            element.textContent = text.trim();
            element.classList.add('upcoming');

        } else if (now < estimatedEndTime) { // Happening Now
            element.textContent = 'Happening Now!';
            element.classList.add('happening');
        } else { // Past
            element.textContent = 'Expired';
            element.classList.add('expired');
        }
    },
    parseEventDateTime(dateString, timeString) {
        // (Keep the robust parsing logic from events.js here)
        try {
             if (!dateString || !timeString) return null;
             // Handle date ranges (e.g., "March 29, 2025 - April 25, 2025 ") - take start date
             const datePart = dateString.split('-')[0].trim();

             // Handle time like "2:00 PM Onwards" or "HH:MM"
             let timePart = timeString.toUpperCase().replace('ONWARDS','').trim();
             let hours = 0;
             let minutes = 0;
             const hasMeridiem = timePart.includes('AM') || timePart.includes('PM');
             let meridiem = null;

              if (hasMeridiem) {
                  meridiem = timePart.includes('PM') ? 'PM' : 'AM';
                  timePart = timePart.replace('AM','').replace('PM','').trim();
              }

              const timeMatch = timePart.match(/(\d{1,2}):(\d{2})/);
              if (timeMatch) {
                  hours = parseInt(timeMatch[1], 10);
                  minutes = parseInt(timeMatch[2], 10);
              } else if (parseInt(timePart, 10)) { // Handle "4" or "14" (assume hour)
                  hours = parseInt(timePart, 10);
              }

               // Adjust for PM/AM if present
               if (meridiem === 'PM' && hours < 12) hours += 12;
               if (meridiem === 'AM' && hours === 12) hours = 0; // Midnight case

               // Attempt to create Date object
               // Using Date.parse is generally more robust if format is known
               const parsedDate = new Date(datePart);
               if (isNaN(parsedDate.getTime())) throw new Error("Invalid date part");

               parsedDate.setHours(hours, minutes, 0, 0);

               if (isNaN(parsedDate.getTime())) throw new Error("Invalid resulting date");

               return parsedDate;

        } catch (e) {
            console.warn(`Could not parse date/time: ${dateString} ${timeString} - Error: ${e.message}`);
            return null;
        }
    }
};