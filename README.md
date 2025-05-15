# Steam Game Score Predictor

A full-stack data-driven application that predicts user review scores for Steam games based on game metadata and user reviews.

## Overview

This project combines data engineering, machine learning and modern web technologies to explore the relationship between user reviews, game genres and overall ratings. It features a complete data pipeline from raw Steam data to predictive analytics, and presents the results through an interactive web interface.

## Use Case

The goal is to demonstrate how natural language processing and structured game data can be used to predict aggregate review scores, providing insights for players, developers, or analysts.

## Getting Started

### Prerequisites

1. **Kaggle API key**
    Replace the placeholder `airflow/kaggle.json` file with your own Kaggle API credentials. You can obtain your Kaggle API token from your [Kaggle account settings](https://www.kaggle.com/settings) by selecting "Create New API Token". This is required for automated dataset downloads from Kaggle.

2. **Docker & Docker Compose**
    Ensure Docker and Docker Compose are installed on your machine.

## Running the Project

To start the application, run the following command from the project root: `docker-compose up`. This will launch all necessary services, including Airflow and the frontend interface.

### ETL Pipeline Execution

Once the services are running: 

1. Open the Airflow web interface at http://localhost:8080.
2. Locate and trigger the DAG named `etl_steam_games`.

This DAG will extract, transform, and load the *steam dataset* into the `steam_games` table in PostgreSQL.

### Model Training (🚧 Work in Progress)

To use the game score prediction feature:

1. Make sure the `etl_steam_games` DAG has been successfully run at least once.
2. Trigger the DAG named `train_pipeline` in Airflow.

### Web Interface

The frontend interface is available at: http://localhost:5173. Use it to interact with the dataset and, in the future, to generate predictions.
