# **App Name**: Kinglotto

## Core Features:

- Manual Draw Entry: Allow users to manually enter lottery draw data, including the draw date and five numbers (01-90), while ensuring that the input is validated to prevent duplicate or invalid numbers.
- Historical Data Consultation: Provide an interface to consult historical data, analyze number regularity, visualize frequent simultaneous numbers, and filter by time periods (e.g., last month, last quarter).
- Lottery Prediction: Implement a lightweight machine learning tool to predict five probable numbers for the next draw based on historical draw analysis, improving predictions by analyzing past errors and displaying confidence percentages.

## Style Guidelines:

- Dark theme as the primary theme for the app.
- Accent color: Vibrant green (#00FF00) to highlight key elements and actions.
- Use clear and intuitive icons for navigation and actions.
- Implement a bottom navigation bar for easy access to the main categories.
- Incorporate smooth transitions and animations for a polished user experience.

## Original User Request:
Objectif
LottoryK Android Application Specification
Develop an elegant, high-performance, and intuitive Android application named Kinglotto using Kotlin, designed to analyze lottery results, record draws, review number recurrence, and predict future draws using a lightweight machine learning algorithm. The app targets four lottery categories: GH18 (Ghana, 18h), CIV10 (Côte d'Ivoire, 10h), CIV13 (Côte d'Ivoire, 13h), and CIV16 (Côte d'Ivoire, 16h).
Main Features
The application is organized into four lottery categories, each with three sub-menus:
Entrées (Entries)

Manual Draw Entry: Record draw date and 5 numbers (01–90).
Input Validation: Prevent duplicates or invalid numbers.
User Interface: Intuitive input with a mobile-friendly virtual numeric keypad.

Consulter (Consult)

Number Regularity Analysis: Frequency of a number in the same or next draw for a selected number.
Frequent Simultaneous Numbers: Visualize numbers commonly drawn together with a given number.
Period Filters: Filter by time periods (e.g., last month, last quarter).

Statistiques (Statistics)

Number Frequency: Frequency of each number per category.
Ranking: Most and least drawn numbers.
Interactive Charts: Histograms and donut charts for trend visualization.
Export: Generate and share PDF reports of statistics.

Prédiction (Prediction)

Prediction Algorithm: Lightweight model based on historical draw analysis.
Learning: Improve predictions by analyzing past errors (e.g., using logistic regression or a simple neural network optimized for mobile).
Output: Display 5 probable numbers for the next draw with confidence percentages.

Technical Requirements
Architecture

Language: Kotlin with Jetpack Compose for modern, reactive UI.
Framework: Android SDK with MVVM architecture.
Storage: Room database for local storage of thousands of draws, with separate tables for GH18, CIV10, CIV13, and CIV16.
Styling: Material Design 3 with a dark theme by default.
Language: French (UI and documentation).
Source Control: GitHub repository at https://github.com/beniskossi/LotteryK.git.

Design

Theme: Dark theme with vibrant accents for a sophisticated look.
Ball Colors:
01–10: Red
11–20: Blue
21–30: Green
31–40: Yellow
41–50: Purple
51–60: Orange
61–70: Cyan
71–80: Pink
81–90: Gray


Interface:
Intuitive navigation with a bottom navigation bar for mobile.
Smooth animations (e.g., transitions between categories or sub-menus).
Clear action buttons (e.g., "Reset Data", "Export PDF").


Responsive: Optimized for various screen sizes (phones, tablets).

Specific Features

Installation: Support for installation via Google Play Store or direct APK.
Data Reset: Per-category reset button with confirmation dialog to prevent accidental deletion.
Offline Mode:
Save draws entered offline with automatic synchronization upon reconnection.
Offline access to consultation and statistics data.


Performance:
Optimize data loading with pagination or lazy loading for large datasets.
Compress assets (images, icons) for faster loading.


Security:
Strict input validation to prevent injection or errors.
No external APIs or keys to ensure independence and privacy.



Prediction Algorithm

Approach: Use probability-based model leveraging conditional probabilities and historical trends.
Learning: Adjust prediction weights based on past errors, stored locally.
Output: List of 5 probable numbers with confidence scores (e.g., 75% for number 42).
Limitation: Use lightweight calculations suitable for mobile devices, avoiding heavy ML libraries.

Constraints

Stability: Unit tests (with JUnit) and UI tests (with Espresso) to ensure reliability.
Performance: Initial load time under 2 seconds on a 4G connection.
Accessibility: Adhere to WCAG 2.1 (high contrast, keyboard navigation).
Storage: Handle thousands of draws without performance degradation.
Language: Fully French interface with clear error messages and intuitive instructions.

Deliverables

Code Source: GitHub repository (https://github.com/beniskossi/Kinglotto.git) with clear structure:
/app/src/main: Kotlin code, Jetpack Compose UI, and Room database logic.
/app/src/main/res: Static assets (icons, drawables).
/app/src/test: Unit and UI tests.


Documentation:
Installation and usage guide.
Instructions for building and deploying the APK.


APK: Build for distribution via Google Play or direct download.
Design: Optional Figma mockups to validate UI before development.

Development Stages

Initialization:
Set up Android project with Kotlin, Jetpack Compose, Room, and Material Design 3.
Initialize GitHub repository and configure CI/CD for builds.


Interface:
Develop Compose UI components for categories, sub-menus, and forms.
Implement dark theme and ball color scheme.


Storage:
Configure Room database for draw storage by category.
Add data validation and reset logic.


Features:
Implement Entries, Consult, Statistics, and Prediction sub-menus.
Add interactive charts using a library like MPAndroidChart.
Develop lightweight prediction algorithm.


Offline Support:
Enable offline data storage and synchronization.
Test offline consultation and statistics access.


Testing:
Write unit tests for business logic and UI tests for navigation.
Test compatibility on Android 9.0+ devices.


Deployment:
Build and publish APK for testing.
Verify offline functionality and performance on real devices.



Recommended Technologies

Frontend: Jetpack Compose, Material Design 3.
Storage: Room database.
Charts: MPAndroidChart for interactive statistics.
Testing: JUnit, Espresso, and Robolectric.
PDF Export: Android PdfDocument or a lightweight library like iText.
Build Tool: Gradle.

Final Considerations

User Experience: Prioritize a clear, intuitive UI with in-app tutorials for new users.
Performance: Optimize Room queries and minimize UI recompositions in Compose.
Scalability: Design for potential addition of new lottery categories.
Maintenance: Document code and provide a guide for future updates.
  