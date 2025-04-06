// /frontend/js/calendar-deals.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("Deal Expiry Calendar script loaded.");

    // --- DOM Elements ---
    const calendarIcon = document.getElementById('calendar-icon');
    const calendarPopup = document.getElementById('calendar-popup');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const monthYearDisplay = document.getElementById('month-year');
    const calendarDaysContainer = document.getElementById('calendar-days');
    const nepaliDateToggle = document.getElementById('nepali-date-toggle');
    const dealExpiryPanel = document.getElementById('deal-expiry-panel'); // Updated ID
    const dealPanelDate = document.getElementById('deal-panel-date');     // Updated ID
    const dealExpiryList = document.getElementById('deal-expiry-list');   // Updated ID
    const closeCalendarBtn = document.getElementById('close-calendar');
    const closeDealPanelBtn = document.getElementById('close-deal-panel'); // Mobile close

    // --- Check Core Elements ---
    if (!calendarPopup || !calendarDaysContainer || !dealExpiryPanel || !calendarIcon) {
        console.error("Calendar Popup core elements not found. Calendar disabled.");
        return;
    }

    // --- State ---
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let showNepaliDatesPrimary = nepaliDateToggle ? nepaliDateToggle.checked : false;
    let selectedDate = null;
    let cachedNepaliDates = {}; // Cache for Nepali date conversions

    // --- Nepali Date Conversion (Requires nepali-date-converter.umd.min.js) ---
    function getNepaliDate(gregorianDate) {
        if (!(gregorianDate instanceof Date) || isNaN(gregorianDate)) return '?';
        const dateString = `${gregorianDate.getFullYear()}-${gregorianDate.getMonth()}-${gregorianDate.getDate()}`;
        if (cachedNepaliDates[dateString]) return cachedNepaliDates[dateString];
        if (typeof NepaliDateConverter !== 'undefined') {
            try {
                const bsDate = new NepaliDateConverter(gregorianDate).getBS();
                const nepaliDay = NepaliDateConverter.toNepali(bsDate.date);
                cachedNepaliDates[dateString] = nepaliDay;
                return nepaliDay;
            } catch (e) { console.error("Error converting to Nepali date:", e); return '-'; }
        } else { console.warn("NepaliDateConverter library not loaded."); return '?'; }
    }

    // --- Deal Data Access ---
    function getExpiringDealsForDate(date) {
        const dateString = formatDateKey(date);
        // Access global data from main.js, ensure it exists
        const allDeals = window.allDealsData || [];
        return allDeals.filter(deal => deal && deal.expiryDate === dateString);
    }
    // Helper to format date as YYYY-MM-DD
    function formatDateKey(date) {
        if (!(date instanceof Date) || isNaN(date)) return '';
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    // --- Calendar Rendering ---
    function renderCalendar(month, year) {
        console.log(`Rendering Deal Calendar: ${year}-${month + 1}`);
        if (!monthYearDisplay || !calendarDaysContainer) return;

        try {
            const nepaliDetails = getNepaliDetails(new Date(year, month, 1)); // Use shared helper if available, else minimal
            const nepaliYearStr = nepaliDetails ? toNepaliDigits(nepaliDetails.year) : '';
            const nepaliMonthStr = nepaliDetails ? nepaliDetails.monthName : '';
            monthYearDisplay.textContent = `${new Date(year, month).toLocaleString('en-US', { month: 'long' })} ${year} / ${nepaliMonthStr} ${nepaliYearStr}`;

            const fragment = document.createDocumentFragment();
            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const today = new Date(); today.setHours(0, 0, 0, 0);

            for (let i = 0; i < firstDayOfMonth; i++) { const d = document.createElement('div'); d.className = 'day inactive'; fragment.appendChild(d); }

            for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
                const dayElement = document.createElement('div'); dayElement.className = 'day';
                const currentDate = new Date(year, month, dayNum); currentDate.setHours(0, 0, 0, 0);
                const dateString = formatDateKey(currentDate);
                dayElement.dataset.date = dateString;

                const nepaliDay = getNepaliDate(currentDate); // Use internal function
                dayElement.innerHTML = `<div class="day-dates"><span class="date-en">${dayNum}</span><span class="date-np">${nepaliDay}</span></div>`;

                // ** Deal Expiry Indicator Logic **
                const expiringDeals = getExpiringDealsForDate(currentDate);
                if (expiringDeals.length > 0) {
                    const indicator = document.createElement('div');
                    indicator.className = 'deal-expiry-indicator';
                    indicator.innerHTML = `<span class="deal-expiry-dot" title="${expiringDeals.length} deal(s) expiring"></span>`;
                    if (expiringDeals.length > 1) { // Add count if more than one
                         indicator.innerHTML += `<span class="deal-expiry-count">${expiringDeals.length}</span>`;
                    }
                    dayElement.appendChild(indicator);
                    dayElement.classList.add('has-expiring-deals');
                }

                if (currentDate.getTime() === today.getTime()) dayElement.classList.add('today');
                if (selectedDate && currentDate.getTime() === selectedDate.getTime()) dayElement.classList.add('selected');
                // Optional: Add holiday class if needed (requires isHoliday function)
                // if (isHoliday(currentDate)) dayElement.classList.add('holiday');

                dayElement.addEventListener('click', () => handleDateClick(dayElement, currentDate));
                fragment.appendChild(dayElement);
            }
            // Add trailing inactive days (simplified)
            const totalCells = firstDayOfMonth + daysInMonth;
            const cellsToAdd = (7 - (totalCells % 7)) % 7;
             for (let i = 0; i < cellsToAdd; i++) { const d = document.createElement('div'); d.className = 'day inactive'; fragment.appendChild(d); }


            calendarDaysContainer.innerHTML = '';
            calendarDaysContainer.appendChild(fragment);

        } catch (e) {
            console.error("Error rendering calendar grid:", e);
            calendarDaysContainer.innerHTML = "<p style='color:red; text-align:center;'>Error loading calendar days.</p>";
        }
    }

    // --- Panel Update ---
    function updateDealExpiryPanel(date) {
        if (!dealExpiryPanel || !dealPanelDate || !dealExpiryList) return;

        const deals = getExpiringDealsForDate(date);
        const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        dealPanelDate.textContent = `Expiring on ${date.toLocaleDateString('en-US', dateOptions)}`;
        dealExpiryList.innerHTML = ''; // Clear list

        if (deals.length > 0) {
            deals.forEach(deal => {
                const li = document.createElement('li');
                li.classList.add('deal-item');
                li.dataset.dealId = deal.id;
                li.innerHTML = `
                    <span class="deal-item-name">${deal.name || 'Unknown Deal'}</span>
                    ${deal.store ? `<span class="deal-item-store">${deal.store}</span>` : ''}
                    ${deal.discountPercentage ? `<span style="color:green; font-weight:bold; margin-left: 5px;">(${deal.discountPercentage}%)</span>`: ''}
                `;
                // Add listener to open the main modal
                li.addEventListener('click', () => {
                    console.log("Clicked expiring deal:", deal.id);
                    // Need access to the openModal function, maybe expose it globally?
                    if (typeof window.openDealModal === 'function') {
                        window.openDealModal(null, deal); // Call a globally exposed function
                        toggleCalendarPopup(false); // Close calendar after clicking deal
                    } else {
                        alert(`Deal Details:\n${deal.name}\nStore: ${deal.store || 'N/A'}\nExpires: ${deal.expiryDate}`);
                    }
                });
                dealExpiryList.appendChild(li);
            });
        } else {
            dealExpiryList.innerHTML = '<li class="no-deals-expiring">No deals expiring on this date.</li>';
        }
        dealExpiryPanel.classList.add('active'); // Make sure panel is visually active if needed by CSS
    }

    // --- Event Handlers ---
    function handleDateClick(dayElement, date) {
        console.log("Calendar date clicked:", date.toDateString());
        if (!calendarDaysContainer) return;
        const previouslySelected = calendarDaysContainer.querySelector('.day.selected');
        if (previouslySelected) previouslySelected.classList.remove('selected');
        dayElement.classList.add('selected');
        selectedDate = date;
        updateDealExpiryPanel(date);

        // Optional: Show panel on mobile if needed by design
        if (isMobileView && dealExpiryPanel) {
             dealExpiryPanel.classList.add('mobile-visible'); // Add class if CSS uses it
        }
    }

    function changeMonth(offset) {
        // Basic animation trigger (add CSS for .fade-out)
        if (calendarDaysContainer) calendarDaysContainer.classList.add('fade-out');
        setTimeout(() => {
            currentMonth += offset;
            if (currentMonth < 0) { currentMonth = 11; currentYear--; }
            else if (currentMonth > 11) { currentMonth = 0; currentYear++; }
            selectedDate = null; // Deselect date
            renderCalendar(currentMonth, currentYear);
            updateDealExpiryPanel(null); // Clear panel
            if (calendarDaysContainer) calendarDaysContainer.classList.remove('fade-out');
        }, 150); // Match CSS transition duration
    }

    function toggleCalendarPopup(forceShow = null) {
        if (!calendarPopup) return;
        const isActive = calendarPopup.classList.contains('active');
        const show = forceShow !== null ? forceShow : !isActive;

        if (show) {
            // Render calendar only if it's empty or if month/year changed potentially
            if (!calendarDaysContainer.hasChildNodes()) {
                 renderCalendar(currentMonth, currentYear);
            }
             calendarPopup.hidden = false; // Ensure not hidden
             // Delay adding class slightly for transition
             requestAnimationFrame(() => {
                 calendarPopup.classList.add('active');
             });
            calendarPopup.setAttribute('aria-hidden', 'false');
            console.log("Calendar opened");
        } else {
            calendarPopup.classList.remove('active');
            calendarPopup.setAttribute('aria-hidden', 'true');
             // Reset panel state on close
             if (dealExpiryPanel) dealExpiryPanel.classList.remove('active', 'mobile-visible');
             if (dealPanelDate) dealPanelDate.textContent = 'Select date for expiring deals';
             if (dealExpiryList) dealExpiryList.innerHTML = '<li class="no-deals-expiring">Select a date...</li>';
             selectedDate = null; // Deselect date
            console.log("Calendar closed");
        }
    }

    function handleResize() {
        const currentlyMobile = window.innerWidth <= 768;
        if (currentlyMobile !== isMobileView) {
            isMobileView = currentlyMobile;
            console.log("Resize. Mobile:", isMobileView);
            // Force close mobile panel if switching to desktop?
            if (!isMobileView && dealExpiryPanel) {
                 dealExpiryPanel.classList.remove('mobile-visible');
            }
        }
    }

    // --- Shared Helper Functions (Minimal versions needed by calendar) ---
     // Minimal version - assumes main.js has the full one
     function getNepaliDetails(targetDate) {
         if (typeof window.getNepaliDetailsGlobal === 'function') { // Check if main.js exposed it
             return window.getNepaliDetailsGlobal(targetDate);
         }
         // Basic fallback if global not found
         if (typeof NepaliDateConverter !== 'undefined') {
              try {
                  const bs = new NepaliDateConverter(targetDate).getBS();
                  return { year: bs.year, month: bs.month -1, day: bs.date, monthName: nepaliMonths[bs.month-1] || '', dayNepali: NepaliDateConverter.toNepali(bs.date), yearNepali: NepaliDateConverter.toNepali(bs.year)};
              } catch { return null; }
         }
         return null;
     }
     function toNepaliDigits(num) {
          if (typeof window.toNepaliDigitsGlobal === 'function') { // Check if main.js exposed it
              return window.toNepaliDigitsGlobal(num);
          }
          // Basic fallback
         return String(num ?? '').split('').map(d => nepaliDigits[parseInt(d)] || d).join('');
     }


    // --- Event Listeners ---
    calendarIcon?.addEventListener('click', () => toggleCalendarPopup());
    closeCalendarBtn?.addEventListener('click', () => toggleCalendarPopup(false));
    prevMonthBtn?.addEventListener('click', () => changeMonth(-1));
    nextMonthBtn?.addEventListener('click', () => changeMonth(1));
    nepaliDateToggle?.addEventListener('change', (event) => {
        showNepaliDatesPrimary = event.target.checked;
        if(calendarPopup) calendarPopup.classList.toggle('nepali-primary', showNepaliDatesPrimary);
        // Re-render needed only if Nepali date text itself changes (it doesn't here, just emphasis)
        // renderCalendar(currentMonth, currentYear);
    });
    closeDealPanelBtn?.addEventListener('click', () => {
        if (dealExpiryPanel) dealExpiryPanel.classList.remove('mobile-visible', 'active');
    });
    // Close popup on outside click
    document.addEventListener('click', (event) => {
        if (calendarPopup?.classList.contains('active') &&
            !calendarPopup.contains(event.target) &&
            !calendarIcon?.contains(event.target)) {
            toggleCalendarPopup(false);
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && calendarPopup?.classList.contains('active')) {
            toggleCalendarPopup(false);
        }
    });
    window.addEventListener('resize', debounce(handleResize, 200));

    // --- Utility: Debounce ---
    function debounce(func, wait) { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; };

    // --- Initial Setup ---
    handleResize(); // Set initial mobile/desktop state
    // Initial render happens when the popup is opened the first time
    console.log("Deal Expiry Calendar Initialized.");

}); // End DOMContentLoaded