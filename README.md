# IoT Mercek Data Analytics & Serverless Dashboard

An end-to-end, serverless IoT data ingestion, processing, and monitoring pipeline. This project processes raw, compressed numeric telemetry logs from IoT devices, parses them using a configuration dictionary (`v1_10.json`), stores them in a remote AWS RDS PostgreSQL database via AWS Lambda, and visualizes the insights on a modern React-based Web Dashboard.

---

## 🏗️ Architecture & Tech Stack

This project is built using a modern, scalable, cloud-native architecture:

- **Frontend (Web Dashboard):** React (Vite), TypeScript, Recharts (Data Visualization), Leaflet (Map Integration), Lucide React (Icons), and TanStack Query (Data Fetching).
- **Backend (API):** Python, Flask, SQLAlchemy, Boto3 (AWS SDK).
- **Database:** PostgreSQL hosted on AWS RDS.
- **Serverless Data Pipeline:** AWS S3 (Raw Log Storage) → S3 Event Triggers → AWS Lambda (Data Processing & Parsing) → AWS RDS (Structured Storage).
- **Infrastructure:** Docker & Docker Compose for seamless local development.
- **CI/CD:** GitHub Actions for automated testing and deployment.

---

## 📁 Project Structure

```
iot-mercek-data-analytics/
├── app/                      # Flask Backend API & Core Logic
│   ├── api/routes.py         # RESTful endpoints for the dashboard
│   ├── core/                 # Parsing, transforming, and mapping logic
│   └── models/               # SQLAlchemy Database Models
├── frontend/                 # React Vite Dashboard Application
│   ├── src/pages/            # Dashboard, Map, Logs, Ingest UI Pages
│   └── src/styles.css        # Modern, aesthetic CSS tokens
├── config/                   # Appliance translation configs (v1_10.json)
├── scripts/                  # Utilities for DB init, population, and simulation
├── lambda_handler.py         # AWS Lambda entry point for S3-triggered events
├── docker-compose.yml        # Local development orchestration
└── .github/workflows/        # Automated CI/CD pipeline definition
```

---

## 🚀 Getting Started

### 1. Prerequisites

- **Docker & Docker Compose** installed on your machine.
- An **AWS Account** with S3, Lambda, and RDS configured.
- Appropriate AWS IAM credentials.

### 2. Environment Variables

Create a `.env` file in the root directory and populate it with your AWS and RDS credentials:

```ini
# AWS Credentials (IAM User)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=eu-north-1

# S3 Bucket
S3_BUCKET_NAME=mercek-logs-bucket-test123

# AWS RDS PostgreSQL Connection
RDS_HOST=your-rds-endpoint.amazonaws.com
RDS_PORT=5432
RDS_USER=db_user
RDS_PASSWORD=db_password
RDS_DB_NAME=postgres
DATABASE_URL=postgresql://db_user:db_password@your-rds-endpoint.amazonaws.com:5432/postgres?sslmode=require
```

### 3. Running Locally with Docker

You can spin up the entire Fullstack application (Frontend + Backend) using a single command:

```bash
docker-compose up -d --build
```

- **Frontend UI:** Available at `http://localhost:5173`
- **Backend API:** Available at `http://localhost:5001`

---

## 📊 Features & Usage

### 1. Modern Web Dashboard
Navigate to `http://localhost:5173` to access the Operations Dashboard. It includes:
- **Live Metrics:** Real-time appliance counts, online/offline status, and total processed logs.
- **Dynamic Charts:** 14-day log volume tracking powered by Recharts.
- **Interactive Map:** View the exact geographical locations of appliances using Leaflet.
- **Detailed Logs Explorer:** Advanced filtering, searching, and pagination to inspect specific appliance events.

### 2. Data Ingestion Simulator
Instead of manual scripts, you can ingest data directly from the Web UI:
- Go to the **Upload Data** page.
- Select a raw `.txt` telemetry log file.
- View a live code-preview of the payload.
- Click **Start Simulation**. The backend will iteratively upload the logs to your AWS S3 bucket, simulating a live data stream.

### 3. Serverless Processing (AWS Lambda)
When a log file is uploaded to the designated S3 bucket, an event triggers `lambda_handler.py`. The Lambda function:
1. Downloads the raw log file.
2. Parses the compressed numeric arrays using `v1_10.json`.
3. Normalizes and validates timestamps.
4. Writes the structured, human-readable data directly into the AWS RDS PostgreSQL database.

---

## 📝 License

This project was developed as a case study for the Artificial Intelligence Expertise Program in partnership with the Ministry of Industry and Technology & Arçelik. All rights reserved.
