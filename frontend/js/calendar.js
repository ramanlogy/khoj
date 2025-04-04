// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("Enhanced Calendar script loaded.");

    // --- DOM Elements ---
    const calendarIcon = document.getElementById('calendar-icon');
    const calendarPopup = document.getElementById('calendar-popup');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const monthYearDisplay = document.getElementById('month-year');
    const calendarDaysContainer = document.getElementById('calendar-days');
    const nepaliDateToggle = document.getElementById('nepali-date-toggle');
    const eventsPanel = document.getElementById('events-panel');
    const eventPanelDate = document.getElementById('event-panel-date');
    const eventPanelList = document.getElementById('event-panel-list');
    const eventCategoriesFilter = document.getElementById('event-categories-filter');
    const closeCalendarBtn = document.getElementById('close-calendar');

    // --- State ---
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let showNepaliDates = nepaliDateToggle ? nepaliDateToggle.checked : false;
    let selectedDate = null;
    let selectedCategories = new Set(); // For filtering events by category
    let cachedNepaliDates = {}; // Cache for Nepali date conversions

    // --- Event Data Structure ---
    // Fetch this from your backend in production
    const eventsData = {
        '2025-04-15': [
            { id: 1, name: 'Live Concert', category: 'entertainment', time: '19:00', location: 'City Hall' },
            { id: 2, name: 'Evening Workshop', category: 'education', time: '18:30', location: 'Community Center' }
        ],
        '2025-04-22': [
            { id: 3, name: 'Art Exhibition', category: 'culture', time: '10:00', location: 'Art Gallery' }
        ],
        '2025-04-05': [
            { id: 4, name: '50% Off Sale', category: 'promotion', time: 'All Day', location: 'City Mall' }
        ],
        '2025-05-01': [
            { id: 5, name: 'May Day Festival', category: 'holiday', time: '09:00', location: 'Central Park' },
            { id: 6, name: 'Tech Workshop', category: 'education', time: '14:00', location: 'Innovation Hub' },
            { id: 7, name: 'Evening Concert', category: 'entertainment', time: '20:00', location: 'Amphitheater' }
        ]
    };

    // --- Category Colors and Icons ---
    const categoryConfig = {
        'entertainment': { color: '#ff7f50', icon: '🎵' },
        'education': { color: '#4682b4', icon: '📚' },
        'culture': { color: '#9370db', icon: '🎨' },
        'holiday': { color: '#2e8b57', icon: '🎉' },
        'promotion': { color: '#ffd700', icon: '💰' },
        'default': { color: '#808080', icon: '📅' }
    };

    /**
     * Efficient Nepali date conversion with caching
     */
    function getNepaliDate(gregorianDate) {
        // Create a date string for caching
        const dateString = `${gregorianDate.getFullYear()}-${gregorianDate.getMonth()}-${gregorianDate.getDate()}`;
        
        // Return cached result if available
        if (cachedNepaliDates[dateString]) {
            return cachedNepaliDates[dateString];
        }
        
        // Convert to Nepali date if library is available
        if (typeof NepaliDateConverter !== 'undefined') {
            try {
                const bsDate = new NepaliDateConverter(gregorianDate).getBS();
                const nepaliDay = NepaliDateConverter.toNepali(bsDate.date);
                
                // Cache the result
                cachedNepaliDates[dateString] = nepaliDay;
                return nepaliDay;
            } catch (e) {
                console.error("Error converting to Nepali date:", e);
                return '-';
            }
        }
        return NepaliDateConverter;
    }

    /**
     * Get events for a specific date
     */
    function getEventsForDate(date) {
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return eventsData[dateString] || [];
    }

    /**
     * Count events by category for a given date
     */
    function countEventsByCategory(date) {
        const events = getEventsForDate(date);
        const counts = {};
        
        events.forEach(event => {
            const category = event.category || 'default';
            counts[category] = (counts[category] || 0) + 1;
        });
        
        return counts;
    }

    /**
     * Renders the calendar grid with optimized performance
     */
    function renderCalendar(month, year) {
        console.log(`Rendering calendar for: ${year}-${month + 1}`);
        
        // Update month/year display
        monthYearDisplay.textContent = `${new Date(year, month).toLocaleString('en-US', { month: 'long' })} ${year}`;
        
        // Create document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        // Calculate first day and days in month
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Get today for highlighting
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Add blank days for the start of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            const blankDay = document.createElement('div');
            blankDay.classList.add('day', 'inactive');
            fragment.appendChild(blankDay);
        }
        
        // Add actual days of the month
        for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');
            
            const currentDate = new Date(year, month, dayNum);
            currentDate.setHours(0, 0, 0, 0);
            
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            dayElement.dataset.date = dateString;
            
            // Container for day content
            const dayContentContainer = document.createElement('div');
            dayContentContainer.classList.add('day-content');
            
            // English date
            const engDateSpan = document.createElement('span');
            engDateSpan.classList.add('eng-date');
            engDateSpan.textContent = dayNum;
            dayContentContainer.appendChild(engDateSpan);
            
            // Nepali date
            const nepaliDateSpan = document.createElement('span');
            nepaliDateSpan.classList.add('nepali-date');
            if (showNepaliDates) {
                const nepaliDate = getNepaliDate(currentDate);
                nepaliDateSpan.textContent = nepaliDate;
                nepaliDateSpan.classList.add('visible');
            }
            dayContentContainer.appendChild(nepaliDateSpan);
            
            dayElement.appendChild(dayContentContainer);
            
            // Event indicators
            const events = getEventsForDate(currentDate);
            if (events.length > 0) {
                const eventIndicator = document.createElement('div');
                eventIndicator.classList.add('event-indicator');
                
                // Count events by category
                const categoryCounts = countEventsByCategory(currentDate);
                
                // Create indicator dots (max 3 visible)
                const maxVisibleIndicators = 3;
                const categories = Object.keys(categoryCounts);
                
                categories.slice(0, maxVisibleIndicators).forEach(category => {
                    const dot = document.createElement('span');
                    dot.classList.add('event-dot');
                    dot.style.backgroundColor = categoryConfig[category]?.color || categoryConfig.default.color;
                    eventIndicator.appendChild(dot);
                });
                
                // Add "+more" indicator if there are more categories than can be shown
                if (categories.length > maxVisibleIndicators) {
                    const moreIndicator = document.createElement('span');
                    moreIndicator.classList.add('more-events');
                    moreIndicator.textContent = '+';
                    eventIndicator.appendChild(moreIndicator);
                }
                
                // Add event count badge
                const countBadge = document.createElement('span');
                countBadge.classList.add('event-count');
                countBadge.textContent = events.length;
                eventIndicator.appendChild(countBadge);
                
                dayElement.appendChild(eventIndicator);
                dayElement.classList.add('has-events');
            }
            
            // Mark today
            if (currentDate.getTime() === today.getTime()) {
                dayElement.classList.add('today');
            }
            
            // Mark selected
            if (selectedDate && currentDate.getTime() === selectedDate.getTime()) {
                dayElement.classList.add('selected');
            }
            
            // Add click listener
            dayElement.addEventListener('click', () => handleDateClick(dayElement, currentDate));
            
            fragment.appendChild(dayElement);
        }
        
        // Clear and update the calendar
        calendarDaysContainer.innerHTML = '';
        calendarDaysContainer.appendChild(fragment);
        
        // Apply animation
        calendarDaysContainer.classList.remove('fade-in');
        void calendarDaysContainer.offsetWidth; // Force reflow
        calendarDaysContainer.classList.add('fade-in');
    }

    /**
     * Handle date selection and event display
     */
    function handleDateClick(dayElement, date) {
        console.log("Date clicked:", date.toDateString());
        
        // Update selected state visually
        const previouslySelected = calendarDaysContainer.querySelector('.day.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }
        dayElement.classList.add('selected');
        selectedDate = date;
        
        // Update and show events panel
        updateEventsPanel(date);
        
        // Add responsive behavior - show events panel on mobile
        if (window.innerWidth < 768) {
            eventsPanel.classList.add('mobile-visible');
        }
    }

    /**
     * Update the events panel with filtered events
     */
    function updateEventsPanel(date) {
        const events = getEventsForDate(date);
        
        // Format date for display
        const dateOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        eventPanelDate.textContent = date.toLocaleDateString('en-US', dateOptions);
        
        // Clear existing events
        eventPanelList.innerHTML = '';
        
        // Update category filter options if not already done
        updateCategoryFilters(events);
        
        // Filter events based on selected categories
        const filteredEvents = selectedCategories.size > 0 
            ? events.filter(event => selectedCategories.has(event.category || 'default'))
            : events;
        
        if (filteredEvents.length > 0) {
            // Sort events by time
            filteredEvents.sort((a, b) => {
                if (a.time === 'All Day') return -1;
                if (b.time === 'All Day') return 1;
                return a.time.localeCompare(b.time);
            });
            
            // Create event list items
            filteredEvents.forEach(event => {
                const li = document.createElement('li');
                li.classList.add('event-item');
                
                const category = event.category || 'default';
                const categoryInfo = categoryConfig[category] || categoryConfig.default;
                
                // Create event card with more details
                li.innerHTML = `
                    <div class="event-card" style="border-left: 4px solid ${categoryInfo.color}">
                        <div class="event-header">
                            <span class="event-icon">${categoryInfo.icon}</span>
                            <span class="event-name">${event.name}</span>
                        </div>
                        <div class="event-details">
                            <span class="event-time">${event.time}</span>
                            <span class="event-location">${event.location || ''}</span>
                        </div>
                    </div>
                `;
                
                li.dataset.eventId = event.id;
                li.addEventListener('click', () => {
                    // Handle event click - could expand details or navigate
                    console.log("Clicked event:", event.name);
                });
                
                eventPanelList.appendChild(li);
            });
        } else {
            // No events message
            const li = document.createElement('li');
            li.classList.add('no-events');
            
            if (selectedCategories.size > 0) {
                li.textContent = 'No events matching selected filters.';
            } else {
                li.textContent = 'No events scheduled for this date.';
            }
            
            eventPanelList.appendChild(li);
        }
        
        // Show the events panel
        eventsPanel.classList.add('active');
    }

    /**
     * Update category filters based on available events
     */
    function updateCategoryFilters(events) {
        // Only update if the filter container exists and hasn't been populated
        if (eventCategoriesFilter && eventCategoriesFilter.children.length === 0) {
            // Get unique categories from all events
            const allCategories = new Set();
            
            // Add categories from current events
            events.forEach(event => {
                allCategories.add(event.category || 'default');
            });
            
            // Add categories from all events data
            Object.values(eventsData).flat().forEach(event => {
                allCategories.add(event.category || 'default');
            });
            
            // Create filter options
            allCategories.forEach(category => {
                const categoryConfig = categoryConfig[category] || categoryConfig.default;
                
                const filterOption = document.createElement('div');
                filterOption.classList.add('category-filter');
                filterOption.dataset.category = category;
                
                filterOption.innerHTML = `
                    <span class="category-dot" style="background-color: ${categoryConfig.color}"></span>
                    <span class="category-name">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                `;
                
                filterOption.addEventListener('click', () => {
                    filterOption.classList.toggle('selected');
                    
                    // Update selected categories
                    if (filterOption.classList.contains('selected')) {
                        selectedCategories.add(category);
                    } else {
                        selectedCategories.delete(category);
                    }
                    
                    // Update events with filter
                    if (selectedDate) {
                        updateEventsPanel(selectedDate);
                    }
                });
                
                eventCategoriesFilter.appendChild(filterOption);
            });
        }
    }

    /**
     * Change month with smooth animation
     */
    function changeMonth(offset) {
        // Add direction class for slide animation
        const direction = offset > 0 ? 'slide-left' : 'slide-right';
        calendarDaysContainer.classList.add('fade-out', direction);
        
        setTimeout(() => {
            currentMonth += offset;
            
            // Handle year change
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            } else if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            
            renderCalendar(currentMonth, currentYear);
            
            // Reset animation classes
            calendarDaysContainer.classList.remove('fade-out', 'slide-left', 'slide-right');
        }, 200);
    }

    /**
     * Toggle calendar popup with transition
     */
    function toggleCalendarPopup() {
        const isOpening = !calendarPopup.classList.contains('active');
        
        calendarPopup.classList.toggle('active');
        
        if (isOpening) {
            console.log("Calendar opened");
            // Only render if needed
            if (!calendarDaysContainer.hasChildNodes()) {
                renderCalendar(currentMonth, currentYear);
            }
            
            // Reset to current month/year when opening
            if (selectedDate) {
                updateEventsPanel(selectedDate);
            }
            
            // Add accessibility attributes
            calendarPopup.setAttribute('aria-hidden', 'false');
        } else {
            console.log("Calendar closed");
            calendarPopup.setAttribute('aria-hidden', 'true');
            
            // Hide mobile events panel if visible
            eventsPanel.classList.remove('mobile-visible');
        }
    }

    /**
     * Responsive behavior for window resize
     */
    function handleResize() {
        // Adjust calendar for mobile/desktop views
        if (window.innerWidth < 768) {
            calendarPopup.classList.add('mobile-view');
        } else {
            calendarPopup.classList.remove('mobile-view');
            eventsPanel.classList.remove('mobile-visible');
        }
    }

    // --- Event Listeners ---
    if (calendarIcon) {
        calendarIcon.addEventListener('click', toggleCalendarPopup);
    }
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => changeMonth(1));
    }
    
    if (nepaliDateToggle) {
        nepaliDateToggle.addEventListener('change', (event) => {
            showNepaliDates = event.target.checked;
            console.log("Show Nepali Dates:", showNepaliDates);
            
            // Update visible class on calendar container
            if (showNepaliDates) {
                calendarDaysContainer.classList.add('nepali-visible');
            } else {
                calendarDaysContainer.classList.remove('nepali-visible');
            }
            
            renderCalendar(currentMonth, currentYear);
        });
    }
    
    if (closeCalendarBtn) {
        closeCalendarBtn.addEventListener('click', () => {
            calendarPopup.classList.remove('active');
        });
    }
    
    // Close events panel on mobile
    document.getElementById('close-events')?.addEventListener('click', () => {
        eventsPanel.classList.remove('mobile-visible');
    });

    // Close popup when clicking outside
    document.addEventListener('click', (event) => {
        if (calendarPopup?.classList.contains('active') && 
            !calendarPopup.contains(event.target) && 
            !calendarIcon?.contains(event.target)) {
            calendarPopup.classList.remove('active');
        }
    });

    // Handle keyboard navigation for accessibility
    calendarDaysContainer?.addEventListener('keydown', (event) => {
        if (!selectedDate) return;
        
        const currentDay = selectedDate.getDate();
        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        let newDate;
        
        switch (event.key) {
            case 'ArrowRight':
                newDate = new Date(currentYear, currentMonth, Math.min(currentDay + 1, lastDay));
                break;
            case 'ArrowLeft':
                newDate = new Date(currentYear, currentMonth, Math.max(currentDay - 1, 1));
                break;
            case 'ArrowUp':
                newDate = new Date(currentYear, currentMonth, Math.max(currentDay - 7, 1));
                break;
            case 'ArrowDown':
                newDate = new Date(currentYear, currentMonth, Math.min(currentDay + 7, lastDay));
                break;
            default:
                return;
        }
        
        // Find and click the corresponding day element
        const dateString = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
        const dayElement = calendarDaysContainer.querySelector(`.day[data-date="${dateString}"]`);
        
        if (dayElement) {
            dayElement.click();
            dayElement.focus();
        }
    });

    // Handle window resize for responsive layout
    window.addEventListener('resize', handleResize);

    // --- Initial Setup ---
    if (nepaliDateToggle?.checked) {
        calendarDaysContainer.classList.add('nepali-visible');
    }
    
    // Set initial responsive class
    handleResize();
    
    // Initial render
    renderCalendar(currentMonth, currentYear);
    console.log("Enhanced calendar initialized.");
    
    // Jump to today if today has events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEvents = getEventsForDate(today);
    
    if (todayEvents.length > 0) {
        // Find and click today's element
        const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const todayElement = calendarDaysContainer.querySelector(`.day[data-date="${todayString}"]`);
        
        if (todayElement) {
            todayElement.click();
        }
    }
});