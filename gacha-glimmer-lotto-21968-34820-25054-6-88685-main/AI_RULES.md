# AI Rules for GachaRush Application

This document outlines the core technologies and best practices for developing the GachaRush application.

## Tech Stack Overview

*   **Vite**: A fast build tool that provides an instant development server and optimized builds.
*   **TypeScript**: A superset of JavaScript that adds static typing, enhancing code quality and maintainability.
*   **React**: A declarative, component-based JavaScript library for building user interfaces.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs directly in your markup.
*   **shadcn/ui**: A collection of re-usable components built with Radix UI and Tailwind CSS, providing accessible and customizable UI elements.
*   **React Router DOM**: The standard library for client-side routing in React applications.
*   **Supabase**: An open-source Firebase alternative providing a PostgreSQL database, authentication, and storage, used as the backend for this application.
*   **Tanstack Query (React Query)**: A powerful library for managing, caching, and synchronizing server state in React applications.
*   **Zod**: A TypeScript-first schema declaration and validation library, used for robust form validation.
*   **React Hook Form**: A performant, flexible, and extensible forms library for React, integrated with Zod for validation.
*   **Sonner**: A modern toast notification library for displaying user feedback.
*   **Lucide React**: A collection of beautiful and customizable SVG icons.
*   **Embla Carousel React**: A lightweight, dependency-free, and highly customizable carousel library.

## Library Usage Rules

To maintain consistency and efficiency, please adhere to the following guidelines when developing:

*   **UI Components**: Always prioritize using components from `shadcn/ui`. If a specific component is not available or doesn't meet the exact requirements, create a new, small, and focused custom component in `src/components/` using Tailwind CSS.
*   **Styling**: All styling must be done using **Tailwind CSS** classes. Avoid inline styles or separate CSS files for components unless absolutely necessary for very specific, isolated cases (which should be rare).
*   **Routing**: Use `react-router-dom` for all navigation within the application. All routes should be defined in `src/App.tsx`.
*   **State Management (Data Fetching)**: For managing server-side data (fetching, caching, mutations), use **Tanstack Query**. For local UI state, `useState` and `useReducer` are preferred.
*   **Forms**: Implement all forms using **React Hook Form** for state management and validation. Integrate with **Zod** for defining and validating form schemas.
*   **Backend Interaction**: All interactions with the backend (authentication, database operations, storage) must be performed using the `supabase` client from `@/integrations/supabase/client`.
*   **Notifications**: Use **Sonner** for displaying all toast notifications to the user.
*   **Icons**: Use icons from the **Lucide React** library.
*   **Carousels**: For any carousel functionality, utilize the `Carousel` component from `shadcn/ui`, which is built on `Embla Carousel React`.
*   **Utility Functions**:
    *   General utility functions (e.g., `cn` for class merging) should reside in `src/lib/utils.ts`.
    *   Domain-specific utility functions (e.g., `formatCurrency`, `rollPrize`, `getRarityColor`) should be placed in `src/lib/gacha.ts`.
*   **File Structure**:
    *   Pages go into `src/pages/`.
    *   Reusable components go into `src/components/`.
    *   Hooks go into `src/hooks/`.
    *   Data definitions go into `src/data/`.
    *   Type definitions go into `src/types/`.
    *   Supabase client and types go into `src/integrations/supabase/`.
*   **Responsiveness**: All new components and layouts must be designed to be fully responsive across different screen sizes, utilizing Tailwind CSS responsive utilities.