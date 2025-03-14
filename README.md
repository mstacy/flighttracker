# Flight Tracker

A real-time 3D flight tracking visualization application built with Angular and Three.js. This project provides an interactive 3D globe visualization of flight paths and aircraft positions. Project is viewable [here](https://mstacy.github.io/flighttracker/).

## Features

-   3D globe visualization using Three.js
-   Real-time flight tracking
-   Interactive camera controls
-   Flight path visualization
-   Aircraft position markers

## Prerequisites

Before running this project, make sure you have the following installed:

-   Node.js (Latest LTS version recommended)
-   npm (comes with Node.js)
-   Angular CLI version 19.1.8

## Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Navigate to `http://localhost:4200/` in your browser. The application will automatically reload if you change any of the source files.

## Project Structure

-   `src/` - Source files for the application
-   `public/` - Public assets
-   `flights.json` - Flight data for visualization

## Building

To build the project for production:

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

## Technologies Used

-   Angular 19.1.0
-   Three.js 0.174.0
-   Angular Material 19.2.2
-   TypeScript 5.7.2

## Additional Resources

-   [Angular Documentation](https://angular.dev/)
-   [Three.js Documentation](https://threejs.org/docs/)
-   [Angular Material Documentation](https://material.angular.io/)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
