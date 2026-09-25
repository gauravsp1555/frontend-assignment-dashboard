# Product Admin Dashboard (Frontend Assignment)

This is a responsive Product Admin Dashboard built using Next.js (App Router), Tailwind CSS, and Axios. It interacts with the DummyJSON API to manage and display products.

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install

Run the development server:
   npm run dev
   
3. Open http://localhost:3000 in your browser.

Login Credentials:

Username: emilys
Password: emilyspass

✅ Completed Features

1.Login & Route Protection: Implemented login with DummyJSON API. Validates credentials, handles errors, stores the token, and guards the dashboard so only logged-in users can access it.

2.Product List: Responsive layout showing product image, title, category, price, rating, and stock (Table on desktop, Cards on mobile).

3.Pagination: Server-side pagination using limit and skip. Includes "Previous/Next" buttons, a page size dropdown (10, 20, 50), and URL state syncing (?page=1&limit=20).

4.Search (Debounced): Implemented a 500ms debounce on the search input to avoid spamming the API. Search queries sync with the URL.

5.Filter & Sort: Users can filter by category and sort by price, rating, or title. Values are synced with the URL.

📝 Developer Notes & Explanations

1. Handling Search and Category Filter Constraint
The Problem: The DummyJSON API does not allow searching and filtering by category at the same time.
My Approach: I decided to keep them mutually exclusive to avoid API errors. When a user types in the search box, I automatically clear the selected category. Conversely, if a user selects a category from the dropdown, I clear the search input. This keeps the UI intuitive while respecting the API's limitations.

2. A Problem I Faced & Fixed
The Problem: During the initial login setup, my code was checking for res.data.token, but the login was failing even with correct credentials.
How I Fixed It: I checked the API response and realized DummyJSON recently updated their API to send accessToken instead of token. I updated my logic to check for res.data.accessToken || res.data.token which immediately fixed the routing issue.

3. State Management & URL Syncing
I used Next.js useRouter and URLSearchParams to keep the page, search, category, and sorting values in the URL. This allows users to refresh the page or share the link without losing their current view.

4. Use of AI Tools
I used AI (Gemini) as a learning assistant during this assignment. It helped me understand how to implement the 500ms debounce function properly without using external libraries, and guided me on how to cleanly sync multiple states (search, filter, sort) with the URL in the Next.js App router. I made sure to understand the logic behind every snippet before integrating it.

