from airflow.decorators import dag, task
from datetime import datetime
import pandas as pd
from sqlalchemy import create_engine
import os
import zipfile

ZIP_PATH = "/opt/airflow/data/steam-games-dataset.zip"
EXTRACT_PATH = "/opt/airflow/data/raw/"
CSV_PATH = "/opt/airflow/data/raw/games.csv"
TMP_PATH_RAW = "/opt/airflow/data/tmp_raw.csv"
TMP_PATH_TRANSFORMED = "/opt/airflow/data/tmp_transformed.csv"
COLUMNS_TO_SELECT = [
    "AppID", "Name", "Release date", "Estimated owners", "Required age", "Price",
    "About the game", "Reviews", "Header image", "Metacritic score", "User score",
    "Positive", "Negative", "Average playtime two weeks", "Categories", "Genres", "Tags"
]

@dag(
    dag_id="etl_steam_games_v2",
    start_date=datetime(2025, 1, 1),
    schedule_interval=None,
    catchup=False,
    tags=["etl", "steam"]
)
def etl_steam_games():

    @task
    def extract() -> str:
        with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
            zip_ref.extractall('/opt/airflow/data/raw/')
        df = pd.read_csv(CSV_PATH)
        df.to_csv(TMP_PATH_RAW, index=False)
        return TMP_PATH_RAW

    @task
    def transform(input_path: str) -> str:
        df = pd.read_csv(input_path)
        os.remove(TMP_PATH_RAW)
        df = df[COLUMNS_TO_SELECT]
        df["Positive Percentage"] = df["Positive"] / (df["Positive"] + df["Negative"]) * 100
        df.to_csv(TMP_PATH_TRANSFORMED, index=False)
        return TMP_PATH_TRANSFORMED

    @task
    def load(transformed_path: str):
        engine = create_engine(os.getenv("DATABASE_URL", "postgresql://user:password@postgres:5432/steamdb"))
        df = pd.read_csv(transformed_path)
        os.remove(TMP_PATH_TRANSFORMED)
        df.to_sql("steam_games", con=engine, if_exists="replace", index=False)

    raw_csv = extract()
    cleaned_csv = transform(raw_csv)
    load(cleaned_csv)

etl_steam_games()
