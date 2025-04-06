// js/api.js

const ApiService = {
    baseUrl: '/api', // Relative path to backend API

    async fetchEvents() {
        const url = `${this.baseUrl}/events`;
        console.log(`[API] Fetching events from: ${url}`); // Logging
        try {
            const response = await fetch(url);
            if (!response.ok) {
                // Try to get error message from backend response body
                let errorMsg = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) { /* Ignore if response body is not JSON */ }
                throw new Error(errorMsg);
            }
            const data = await response.json();
            console.log('[API] Successfully fetched events:', data.length); // Logging
            // Basic validation: is it an array?
            if (!Array.isArray(data)) {
                 throw new Error('Invalid data format received from server.');
            }
            return data;
        } catch (error) {
            console.error("[API] Could not fetch events:", error);
            UIService.showFetchError(`Failed to load events: ${error.message}`); // Display error to user via UI service
            return []; // Return empty array on failure
        }
    }
    // Add more API functions here later (e.g., submitEvent)
};