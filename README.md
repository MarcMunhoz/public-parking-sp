# Public Parking SP

![Status](https://img.shields.io/badge/status-in%20development-orange)
![Quasar](https://img.shields.io/badge/Quasar-2.16+-1976D2?logo=quasar&logoColor=white)
![Vue](https://img.shields.io/badge/Vue-3.4-42b883?logo=vuedotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-06b6d4?logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed?logo=docker&logoColor=white)

Web application for searching public and private parking in Sao Paulo, built with Quasar + Vue 3 + TypeScript and styled with Tailwind CSS.

## Stack

- Quasar (CLI with Vite)
- Vue 3
- TypeScript
- Tailwind CSS
- Docker / Docker Compose

## Project structure

- `app/`: Quasar application source code
- `Dockerfile`: development image
- `docker-compose.yaml`: service definition to run the app in a container
- `Makefile`: shortcuts for Docker workflow

## Run with Docker (recommended)

Prerequisite: Docker and Docker Compose installed.

```bash
make dev
```

The application will be available at `http://localhost:3000`.

Useful commands:

```bash
make logs
make stop
make start
make restart
make down
```

## Run locally (without Docker)

Prerequisite: Node.js and Yarn.

```bash
cd app
yarn install
yarn dev
```

The application will be available at `http://localhost:3000`.

## Notes

- Project is under active development; structure and layout may change.
- Current focus is visual experience and core navigation flows.
