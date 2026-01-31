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

## License

This project is licensed under the MIT license.

