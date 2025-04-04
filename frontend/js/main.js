// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    console.log("Main script loaded.");

    // --- DOM Elements ---
    const eventsGridContainer = document.getElementById('events-grid-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const filterButtonsContainer = document.getElementById('filter-buttons-container');
    const sortSelect = document.getElementById('sort-events');
    const copyrightYearSpan = document.getElementById('current-year');
    const currentDateDisplay = document.getElementById('current-date-display');

    // Modal elements
    const modal = document.getElementById('myModal');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalImage = document.getElementById('modal-image');
    const modalDetails = document.getElementById('modal-details');


    // --- State ---
    let allEventsData = []; // Store all fetched event data
    let currentFilter = 'all';
    let currentSort = 'date-asc';

    // --- Functions ---

    /**
     * Fetches event data from an API or source.
     * Replace with your actual data fetching mechanism.
     */
    async function fetchEvents() {
        console.log("Fetching events...");
        loadingIndicator.style.display = 'block'; // Show loading
        eventsGridContainer.innerHTML = ''; // Clear existing grid

        try {
            // --- Simulate API Call ---
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

            // Replace with actual API endpoint: const response = await fetch('/api/events');
            // if (!response.ok) throw new Error('Network response was not ok');
            // allEventsData = await response.json();

            // --- Using Dummy Data ---
            allEventsData = [
                 { id: 'evt1', name: 'Awesome Live Concert', category: 'concert', date: '2025-04-15T20:00:00', location: 'Music Hall, Kathmandu', price: 1500, description: 'Join us for an unforgettable night...', imageUrl: '/assets/images/concert.jpg' },
                 { id: 'evt2', name: 'Art Exhibition Opening', category: 'art', date: '2025-04-22T18:00:00', location: 'Art Gallery Central', price: 0, description: 'Discover new talents...', imageUrl: '/assets/images/art.jpg' },
                 { id: 'evt3', name: 'Kathmandu Tech Workshop', category: 'workshop', date: '2025-05-05T09:00:00', location: 'Innovation Hub', price: 500, description: 'Learn the latest tech trends...', imageUrl: '/assets/images/workshop.jpg' },
                 { id: 'evt4', name: 'Spring Food Festival', category: 'festival', date: '2025-05-10T11:00:00', location: 'Tundikhel Ground', price: 200, description: 'Taste delicious food from various stalls...', imageUrl: '/assets/images/festival.jpg' },
                 { id: 'evt5', name: 'Another Concert', category: 'concert', date: '2025-05-20T19:30:00', location: 'Open Arena', price: 1200, description: 'Rock the night away!', imageUrl: '/assets/images/concert2.jpg' },
                 { id: 'evt6', name: 'Expired Event Example', category: 'workshop', date: '2025-03-01T10:00:00', location: 'Old Venue', price: 100, description: 'This event has passed.', imageUrl: '/assets/images/workshop_old.jpg' }
            ];
            console.log("Events fetched/loaded:", allEventsData);
            renderEvents(); // Initial render after fetch

        } catch (error) {
            console.error("Failed to fetch events:", error);
            eventsGridContainer.innerHTML = '<p style="color: red; text-align: center;">Failed to load events. Please try again later.</p>';
        } finally {
            loadingIndicator.style.display = 'none'; // Hide loading
        }
    }

    /**
     * Renders events based on current filters and sorting.
     */
    function renderEvents() {
        console.log(`Rendering events with filter: ${currentFilter}, sort: ${currentSort}`);
        eventsGridContainer.innerHTML = ''; // Clear grid

        // 1. Filter
        let filteredEvents = allEventsData;
        if (currentFilter !== 'all') {
            filteredEvents = allEventsData.filter(event => event.category === currentFilter);
        }

        // 2. Sort
        filteredEvents.sort((a, b) => {
            switch (currentSort) {
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'price-asc':
                    return (a.price || 0) - (b.price || 0); // Handle free events
                case 'price-desc':
                    return (b.price || 0) - (a.price || 0);
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        

        // 3. Create HTML and Append
        if (filteredEvents.length === 0) {
             eventsGridContainer.innerHTML = '<p style="text-align: center; color: var(--light-text);">No events match the current filter.</p>';
             return;
        }

        filteredEvents.forEach(event => {
            const card = createEventCard(event);
            eventsGridContainer.appendChild(card);
        });

        // Re-initialize countdowns for newly rendered cards
        initializeCountdowns();
        // Add scroll listeners for descriptions
        addDescriptionScrollListeners();
        // Add image zoom listeners
        addImageZoomListeners();
    }

    /**
     * Creates an HTML element for a single event card.
     */
    function createEventCard(event) {
        const card = document.createElement('div');
        card.classList.add('event-card');
        card.dataset.category = event.category;
        card.dataset.date = event.date;
        card.dataset.eventId = event.id; // Add event ID for reference

        const startDate = new Date(event.date);
        const now = new Date();
        let counterClass = 'upcoming';
        let counterText = 'Loading countdown...';

        if (startDate < now) {
             counterClass = 'expired';
             counterText = 'Event has ended';
         } else if (/* check if happening now - requires end date */ false) {
             // counterClass = 'happening';
             // counterText = 'Happening Now!';
         }


        card.innerHTML = `
            <div class="event-image" style="background-image: url('${event.imageUrl || '/assets/images/event-placeholder.jpg'}');" data-img-src="${event.imageUrl || '/assets/images/event-placeholder.jpg'}">
                <span class="event-category">${event.category}</span>
                <div class="expand-image-icon" title="Expand Image"><i class="fas fa-expand"></i></div>
            </div>
            <div class="event-content">
                <h3 class="event-title">${event.name}</h3>
                <div class="event-meta">
                    <span class="event-date"><i class="fas fa-calendar-alt"></i> ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span class="event-time"><i class="fas fa-clock"></i> ${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                    <span class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                </div>
                <div class="event-description">
                    <p>${event.description}</p>
                    <span class="scroll-indicator" style="display: none;">▼</span>
                </div>
                 <div class="event-time-counter ${counterClass}" data-start-time="${event.date}">
                     ${counterText}
                 </div>
                <div class="event-footer">
                    <span class="event-price-tag ${event.price === 0 ? 'free' : ''}">${event.price === 0 ? 'Free' : `NPR ${event.price}`}</span>
                    <button class="event-button details-button" data-event-id="${event.id}">Details</button>
                </div>
            </div>
        `;
        return card;
    }

 // Make data accessible globally (for simplicity in this example)
window.allEventsData = [];


// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    console.log("Main script loaded.");

    // --- DOM Elements ---
    const eventsGridContainer = document.getElementById('events-grid-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const filterButtonsContainer = document.getElementById('filter-buttons-container');
    const sortSelect = document.getElementById('sort-events');
    const copyrightYearSpan = document.getElementById('current-year');
    const currentDateDisplay = document.getElementById('current-date-display');
    const featuredContainer = document.getElementById('featured-events-container'); // Added

    // Modal elements (keep as before)
    const modal = document.getElementById('myModal');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalImage = document.getElementById('modal-image');
    const modalDetails = document.getElementById('modal-details');

    // --- State ---
    // Removed local allEventsData, using window.allEventsData
    let currentFilter = 'all';
    let currentSort = 'date-asc';

    // --- Functions ---

    /**
     * Fetches event data from events.json.
     */
    async function fetchEvents() {
        console.log("Fetching events from events.json...");
        loadingIndicator.style.display = 'block';
        eventsGridContainer.innerHTML = '';
        if (featuredContainer) featuredContainer.innerHTML = ''; // Clear featured too

        try {
            const response = await fetch('events.json'); // Fetch the local JSON file
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            window.allEventsData = data; // Store fetched data globally

            console.log("Events fetched successfully:", window.allEventsData);
            renderEvents(); // Initial render after fetch
            renderFeaturedEvents(); // Render the featured section

        } catch (error) {
            console.error("Failed to fetch events:", error);
            eventsGridContainer.innerHTML = `<p style="color: red; text-align: center;">Failed to load events. (${error.message})</p>`;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    document.getElementById('openCalendar').addEventListener('click', function() {
        // Open the calendar HTML page
        window.location.href = 'calendar.html';
    });

    // ... (keep renderEvents, createEventCard, initializeCountdowns, updateCountdownElement, etc.)

    /**
     * Renders the "Don't Miss" / Featured events section.
     */
     function renderFeaturedEvents() {
         if (!featuredContainer) return; // Exit if the container doesn't exist

         console.log("Rendering featured events...");
         featuredContainer.innerHTML = ''; // Clear previous content

         const featuredItems = window.allEventsData.filter(item => item.isFeatured === true);

         if (featuredItems.length === 0) {
             // Optional: Hide the section or show a message if no featured items
             // document.getElementById('featured-events').style.display = 'none';
             console.log("No featured events found.");
             return;
         }

         // Optionally limit the number of featured items shown
         const itemsToShow = featuredItems.slice(0, 3); // Show max 3 featured items

         itemsToShow.forEach(item => {
             // Reuse createEventCard, assuming deals/programs have similar enough structure
             // Or create a specific card function for featured items if needed
             const card = createEventCard(item);
             featuredContainer.appendChild(card);
         });

         // Initialize countdowns/listeners for featured items too
         initializeCountdowns(); // This might need adjustment if elements are outside the main grid
         addDescriptionScrollListeners();
         addImageZoomListeners();
     }


    // --- Event Listeners ---
    // ... (keep existing listeners for filters, sort, modal)

    // --- Initial Setup ---
    updateCopyrightYear();
    updateCurrentDate();
    fetchEvents(); // Start fetching events when the page loads

}); // End DOMContentLoaded
     /**
      * Initializes or updates all countdown timers on the page.
      */
     function initializeCountdowns() {
         const countdownElements = eventsGridContainer.querySelectorAll('.event-time-counter:not(.expired)'); // Select only non-expired counters
         console.log(`Initializing ${countdownElements.length} countdowns.`);

         countdownElements.forEach(el => {
             const startTimeAttr = el.dataset.startTime;
             if (!startTimeAttr) return;

             const startTime = new Date(startTimeAttr);
             const now = new Date();
             const timeDifference = startTime - now;

             if (timeDifference <= 0) {
                 // Event started or passed while rendering - handle this case if needed
                 // For now, we assume initial check in createEventCard was sufficient
                 // Or if it just started, mark as happening
                 if (!el.classList.contains('happening')){ // Add happening state if logic permits
                     // el.classList.remove('upcoming');
                     // el.classList.add('happening');
                     // el.textContent = 'Happening Now!';
                 }
                 // If truly expired after render, update state (less likely with initial check)
                 // else {
                 //     el.classList.remove('upcoming', 'happening');
                 //     el.classList.add('expired');
                 //     el.textContent = 'Event has ended';
                 // }

             } else {
                 updateCountdownElement(el, timeDifference); // Initial update

                 // Set interval only if not already set (avoid multiple intervals)
                 if (!el.dataset.intervalId) {
                     const intervalId = setInterval(() => {
                         const currentTime = new Date();
                         const newTimeDifference = startTime - currentTime;
                         if (newTimeDifference <= 0) {
                             clearInterval(intervalId);
                             el.classList.remove('upcoming');
                             el.classList.add('expired'); // Or happening if you have end times
                             el.textContent = 'Event has ended';
                             delete el.dataset.intervalId; // Clean up
                         } else {
                             updateCountdownElement(el, newTimeDifference);
                         }
                     }, 1000); // Update every second
                     el.dataset.intervalId = intervalId; // Store interval ID
                 }
             }
         });
     }

     /**
      * Updates the text content of a single countdown element.
      */
      function updateCountdownElement(element, timeDifference) {
         const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
         const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
         const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
         const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

         let text = 'Starts in: ';
         if (days > 0) text += `${days}d `;
         if (days > 0 || hours > 0) text += `${hours}h `;
         if (days > 0 || hours > 0 || minutes > 0) text += `${minutes}m `;
         text += `${seconds}s`;

         element.textContent = text;
      }

    /**
     * Updates the active state of filter buttons.
     */
    function updateFilterButtons() {
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
     * Adds scroll listeners to event descriptions to show/hide indicator.
     */
     function addDescriptionScrollListeners() {
        const descriptions = eventsGridContainer.querySelectorAll('.event-description');
        descriptions.forEach(desc => {
            const indicator = desc.querySelector('.scroll-indicator');
            if (!indicator) return;

            // Initial check
            if (desc.scrollHeight > desc.clientHeight) {
                indicator.style.display = 'block';
            } else {
                indicator.style.display = 'none';
            }

            // Add listener if not already added
            if (!desc.dataset.scrollListenerAdded) {
                 desc.addEventListener('scroll', () => {
                     // Hide indicator if scrolled near the bottom
                     if (desc.scrollHeight - desc.scrollTop <= desc.clientHeight + 10) { // 10px threshold
                         indicator.style.opacity = '0';
                     } else {
                         indicator.style.opacity = '1';
                     }
                 });
                 desc.dataset.scrollListenerAdded = 'true'; // Mark as listener added
             }
        });
     }

     /**
      * Adds click listeners to image expand icons.
      */
      function addImageZoomListeners() {
         const images = eventsGridContainer.querySelectorAll('.event-image');
         images.forEach(imgContainer => {
             const icon = imgContainer.querySelector('.expand-image-icon');
             const imgSrc = imgContainer.dataset.imgSrc;

             if (icon && imgSrc && !imgContainer.dataset.zoomListenerAdded) {
                 icon.addEventListener('click', (e) => {
                     e.stopPropagation(); // Prevent card click if details button exists
                     console.log("Zooming image:", imgSrc);
                     openModal(imgSrc); // Open modal with image
                 });
                 imgContainer.dataset.zoomListenerAdded = 'true';
             }
         });
      }

      /**
       * Adds click listeners to details buttons.
       */
      function addDetailsButtonListeners() {
          const buttons = eventsGridContainer.querySelectorAll('.details-button');
          buttons.forEach(button => {
              if (!button.dataset.detailsListenerAdded) {
                  button.addEventListener('click', (e) => {
                     const eventId = e.target.dataset.eventId;
                     console.log("Details requested for event:", eventId);
                     const eventData = allEventsData.find(evt => evt.id === eventId);
                     if (eventData) {
                         // Option 1: Open Modal with Details
                          openModal(null, eventData); // Pass null for image, or eventData.imageUrl

                         // Option 2: Navigate to a details page
                         // window.location.href = `/event-details.html?id=${eventId}`;
                     } else {
                         console.error("Event data not found for ID:", eventId);
                     }
                  });
                  button.dataset.detailsListenerAdded = 'true';
              }
          });
      }

    /**
     * Opens the modal, optionally with an image or details.
     */
     function openModal(imageUrl = null, eventDetails = null) {
        if (imageUrl) {
            modalImage.src = imageUrl;
            modalImage.style.display = 'block';
            modalDetails.style.display = 'none';
        } else if (eventDetails) {
            modalImage.style.display = 'none';
            modalDetails.style.display = 'block';
            // Populate modalDetails with formatted event data
            modalDetails.innerHTML = `
                <h3>${eventDetails.name}</h3>
                <p><strong>Date:</strong> ${new Date(eventDetails.date).toLocaleString()}</p>
                <p><strong>Location:</strong> ${eventDetails.location}</p>
                <p><strong>Price:</strong> ${eventDetails.price === 0 ? 'Free' : `NPR ${eventDetails.price}`}</p>
                <hr>
                <p>${eventDetails.description}</p>
            `;
        } else {
            console.error("Modal opened without content.");
            return; // Don't open if no content
        }
         modal.style.display = "block";
     }

    /**
     * Closes the modal.
     */
    function closeModal() {
        modal.style.display = "none";
        modalImage.src = ""; // Clear image src
        modalDetails.innerHTML = ""; // Clear details
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
             const now = new Date();
             const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
             currentDateDisplay.textContent = `Today is ${now.toLocaleDateString('en-US', options)}`;
         }
     }

    /**
     * Placeholder for sprinkle effect logic (requires more setup)
     */
    function createSprinkles(event) {
        // Logic to create and animate .sprinkle elements on click/hover
        console.log("Sprinkle effect triggered (placeholder)");
    }

    // --- Event Listeners ---

    // Filter button clicks
    if (filterButtonsContainer) {
        filterButtonsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-button')) {
                currentFilter = e.target.dataset.filter;
                console.log("Filter changed:", currentFilter);
                updateFilterButtons();
                renderEvents();
                 // Trigger sprinkle effect on button click?
                 createSprinkles(e);
            }
        });
    }

    // Sort dropdown change
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            console.log("Sort changed:", currentSort);
            renderEvents();
        });
    }

     // Modal close button
     if (modalCloseButton) {
         modalCloseButton.addEventListener('click', closeModal);
     }

     // Close modal when clicking outside the content
     if (modal) {
         modal.addEventListener('click', (event) => {
             if (event.target === modal) { // Check if click is on the background overlay
                 closeModal();
             }
         });
     }

     // Add listeners for dynamically created elements (use event delegation on container)
     if (eventsGridContainer) {
         eventsGridContainer.addEventListener('click', (e) => {
             // Image Zoom Icon Click
             const zoomIcon = e.target.closest('.expand-image-icon');
             if (zoomIcon) {
                  e.stopPropagation();
                  const imgContainer = zoomIcon.closest('.event-image');
                  const imgSrc = imgContainer?.dataset.imgSrc;
                  if (imgSrc) {
                      console.log("Zooming image (delegated):", imgSrc);
                      openModal(imgSrc);
                  }
                  return; // Handled
             }

             // Details Button Click
             const detailsButton = e.target.closest('.details-button');
             if (detailsButton) {
                  const eventId = detailsButton.dataset.eventId;
                  console.log("Details requested (delegated):", eventId);
                  const eventData = allEventsData.find(evt => evt.id === eventId);
                  if (eventData) openModal(null, eventData);
                  else console.error("Event data not found (delegated):", eventId);
                  return; // Handled
             }

             // Could add card click listener here too if needed
             // const card = e.target.closest('.event-card');
             // if (card) { console.log("Card clicked:", card.dataset.eventId); }

         });
     }


    // --- Initial Setup ---
    updateCopyrightYear();
    updateCurrentDate();
    fetchEvents(); // Start fetching events when the page loads

}); // End DOMContentLoaded