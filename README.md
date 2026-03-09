# Neptune Thespian

A background worker that manages scheduled device operations.

## Overview

Neptune Thespian is a TypeScript-based service designed to handle the orchestration and execution of scheduled operations across devices. It provides a reliable, scalable solution for managing timed tasks and device-specific workflows.

## Features

- **Scheduled Task Management**: Execute operations on a defined schedule
- **Device Operations**: Manage and coordinate operations across multiple devices
- **Background Processing**: Asynchronous task execution without blocking
- **TypeScript**: Fully typed codebase for enhanced reliability and maintainability

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn package manager
- Docker (optional, for containerized deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Marc-Moonshot/neptune-thespian.git
cd neptune-thespian
2. Install deps:
```bash
npm install
```
## Configuration
Configure the application by setting up environment variables as needed for your deployment environment.

### Development

```bash
npm run dev
```
### Building

```bash
npm run build
```
### Running the Service

```bash
npm start
```
### Docker Deployment
#### Build and Run container
```bash
docker compose up --build
```

