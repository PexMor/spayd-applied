# SPAYD Applied

App is available at <https://pexmor.github.io/spayd-applied/>

Inspired by: <https://qr-platba.cz/>

**SPAYD Applied** is a web application designed to simplify the generation of Czech QR payments (SPAYD - Short Payment Descriptor) and help organize cashflow. It allows users to easily create payment QR codes, manage multiple bank accounts, track payment events, and maintain a history of generated payments.

## Features

-   **QR Code Generation**: Quickly generate standard Czech QR payment codes by entering payment details (amount, account, variable symbol, message).
-   **Account Management**: Save and manage multiple bank accounts (IBANs) for quick selection during payment generation.
-   **Event Tracking**: Define and manage payment events (e.g., "Lunch", "Cinema", "Rent") to categorize payments.
-   **Payment History**: Automatically saves a history of generated payments for future reference.
-   **Offline Capability**: Built with local storage (IndexedDB) to work offline.
-   **Sync Functionality**: (Optional) Sync generated payments to a backend server for further processing or backup.
-   **Global Configuration**: Configure application-wide settings like webhook URLs for syncing.
-   **Internationalization**: Supports Czech and English languages.

## Installation & Usage

This project is built with [Vite](https://vitejs.dev/) and [Preact](https://preactjs.com/).

### Prerequisites

-   Node.js (v16 or higher recommended)
-   Yarn or npm

### Steps

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    yarn install
    # or
    npm install
    ```
3.  Start the development server:
    ```bash
    yarn dev
    # or
    npm run dev
    ```
4.  Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

## Application Screens

### Main Screen (Generate)
The core interface for generating QR codes. Select an account, an event, enter the amount and an optional message. The Variable Symbol (VS) is often automatically generated or can be manually input.

<a href="imgs/generate.png"><img src="imgs/generate.png" alt="Main screen" height="400"/></a>

#### QR Display
Once the form is submitted, the generated QR code is displayed, ready to be scanned by a mobile banking app.

<a href="imgs/qr-spayd.png"><img src="imgs/qr-spayd.png" alt="QR displayed" height="400"/></a>

### Accounts Management
Manage your bank accounts here. You can add new accounts with their IBANs and assign them friendly names. These accounts populate the dropdown in the Main Screen.

<a href="imgs/accounts.png"><img src="imgs/accounts.png" alt="Accounts" height="400"/></a>

### Events Management
Define recurring or common payment types (Events). Each event can have a default amount and is linked to a specific bank account.

<a href="imgs/events.png"><img src="imgs/events.png" alt="Events" height="400"/></a>

### Payment History
View a log of all previously generated QR payments. This helps in tracking what you've requested or paid.

<a href="imgs/history.png"><img src="imgs/history.png" alt="History" height="400"/></a>

### Sync Queue
Monitor the status of payments being synced to the backend. Useful if you are using the webhook integration.

<a href="imgs/sync-queue.png"><img src="imgs/sync-queue.png" alt="Sync queue" height="400"/></a>

### Global Configuration
Configure global settings for the application, such as the Webhook URL used for syncing payment data.

<a href="imgs/global-config.png"><img src="imgs/global-config.png" alt="Global config" height="400"/></a>
