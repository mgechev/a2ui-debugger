# A2UI Debugger

A standalone debugger application for A2UI (Abstract Agent UI) interactions. This tool allows developers to inspect, visualize, and debug the communication between an A2UI server (typically an LLM agent) and a client.

## Features

- **Log Viewer**: View a chronological history of `ServerToClientMessage` events.
- **State Inspection**: Visualize the current surface state as a JSON tree.
- **Surface Preview**: Render the UI surface based on the current state using `@a2ui/angular`.
- **Time Travel**: Step back in time to inspect previous states of the UI.
- **Theme Support**: Includes a default theme for rendering A2UI components.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm

## Getting Started

1.  **Install dependencies**:

    ```bash
    npm install
    ```

2.  **Start the development server**:

    ```bash
    npm start
    ```

    This will run the application on `http://localhost:4200` (or another available port).

## Project Structure

This project is built with Angular and leverages:

-   `@a2ui/angular`: For rendering A2UI components.
-   `@a2ui/lit`: For core A2UI types and data handling.
-   `@angular/material`, `@angular/cdk`: UI components used within the debugger interface.

The source code is located in `projects/debugger/src`.

## Usage

This debugger is typically run alongside an A2UI client or server. It can be integrated into an application or run as a standalone tool to analyze captured logs.

## SSE Stream Debugging

The debugger supports connecting to an external Server-Sent Events (SSE) source to stream A2UI messages in real-time.

1.  **Open the Debugger**: Launch the app as described above.
2.  **Access SSE Controls**: In the **Message Log** panel header, click on **SSE Stream** to expand the controls.
3.  **Connect**: Enter your SSE endpoint URL (default: `http://localhost:8000/stream`) and click **Connect**.
4.  **View Updates**: As messages arrive, they will appear in the log, update the state/preview, and be appended to the input editor.

### Testing with the Sample Server

A sample Node.js SSE server is included to verify functionality.

1.  **Run the test server**:
    ```bash
    node sse-server.js
    ```
    This starts a stream at `http://localhost:8000/stream`.

2.  **Connect**: In the debugger, use the default URL and click **Connect**. You will see a simulated sequence of A2UI updates.

## License

This project is licensed under the MIT license.

