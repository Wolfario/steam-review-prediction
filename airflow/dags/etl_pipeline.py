import os
import requests
import kaggle
import numpy as np
from datetime import datetime
from bs4 import BeautifulSoup
import pandas as pd
from airflow.decorators import dag, task
from sqlalchemy import create_engine
from kaggle.api.kaggle_api_extended import KaggleApi

# Define file paths and columns to be used across tasks
EXTRACT_PATH = "/opt/airflow/data/raw/"
CSV_PATH = "/opt/airflow/data/raw/games.csv"
TMP_PATH_LOCAL = "/opt/airflow/data/tmp_local.csv"
TMP_PATH_UPCOMING = "/opt/airflow/data/tmp_upcoming.csv"
TMP_PATH_MERGED = "/opt/airflow/data/tmp_merged.csv"
TMP_PATH_TRANSFORMED = "/opt/airflow/data/tmp_transformed.csv"

# Columns we care about from both local and scraped data
COLUMNS_TO_SELECT = [
    "AppID", "Name", "Release date", "Estimated owners", "Required age", "Price",
    "About the game", "Reviews", "Header image", "Metacritic score", "User score",
    "Positive", "Negative", "Average playtime two weeks", "Categories", "Genres", "Tags"
]

# Function to scrape upcoming games data from Steam store
def find_upcoming_games():
    URL = "https://store.steampowered.com/explore/upcoming/"

    # Attempt to fetch the Steam upcoming games webpage
    try:
        page = requests.get(URL, timeout=10)
        page.raise_for_status()
    except requests.RequestException as e:
        print(f"Failed to fetch the main page: {e}")
        return pd.DataFrame(columns=COLUMNS_TO_SELECT)

    soup = BeautifulSoup(page.content, "html.parser")
    
    # Extract game IDs from the upcoming games section
    upcoming_games_html = soup.select("div.home_tabs_content div.tab_content a.tab_item")
    upcoming_games_ids = [tag['data-ds-appid'] for tag in upcoming_games_html if 'data-ds-appid' in tag.attrs]

    result = {key: [] for key in COLUMNS_TO_SELECT}

    # Iterate through each game ID and call the Steam API to get full game data
    for appid in upcoming_games_ids:
        try:
            resp = requests.get(f'http://store.steampowered.com/api/appdetails?appids={appid}', timeout=10)
            resp.raise_for_status()
            game_json = resp.json()
            
            # Validate that the API returned successful data
            if not game_json.get(appid, {}).get('success') or 'data' not in game_json[appid]:
                raise ValueError("Invalid game data")
            
            game_info = game_json[appid]['data']
        except (requests.RequestException, ValueError, KeyError) as e:
            print(f"Skipping appid {appid}: {e}")
            continue

        # Extract selected fields and format them
        result['AppID'].append(appid)
        result['Name'].append(game_info.get('name'))
        result['Required age'].append(game_info.get('required_age'))
        result['About the game'].append(game_info.get('short_description'))
        result['Header image'].append(game_info.get('header_image'))
        genres = game_info.get('genres', [])
        result['Genres'].append(",".join(g.get('description', '') for g in genres))
        categories = game_info.get('categories', [])
        result['Categories'].append(",".join(c.get('description', '') for c in categories))

        # Fill in unavailable fields with NaN to maintain consistent structure
        for none_attr in [
            "Release date", "Estimated owners", "Price", "Reviews", 
            "Metacritic score", "User score", "Positive", "Negative", 
            "Average playtime two weeks", "Tags"
        ]:
            result[none_attr].append(np.nan)
    
    return pd.DataFrame(result)

# Define the Airflow DAG
@dag(
    dag_id="etl_steam_games",
    start_date=datetime(2025, 1, 1),
    schedule_interval=None,
    catchup=False,
    tags=["etl", "steam"]
)

def etl_steam_games():

    # Task 1.1.1: Download dataset from Kaggle if it doesn't already exist
    @task
    def download_steam_data():
        if not os.path.exists("/opt/airflow/data/games.csv"):
            api = KaggleApi()
            api.authenticate()
            api.dataset_download_files("fronkongames/steam-games-dataset", path="/opt/airflow/data", unzip=True)
            if os.path.exists("/opt/airflow/data/games.json"):
                os.remove("/opt/airflow/data/games.json")
        return "/opt/airflow/data/games.csv"

    # Task 1.1.2: Extract and store the local Kaggle data
    @task
    def extract_local(games_path: str) -> str:
        df = pd.read_csv(games_path, index_col=False)

        # Create a dictionary to hold column name mappings for renaming
        columns_to_change = dict()
        # Loop over column indices from 8 to 38 (inclusive), which are the columns that got shifted
        for idx in range(8, 39):
            columns_to_change[df.columns[idx]] = df.columns[idx-1]
        
        # Drop the problematic column 'DiscountDLC count' that caused the misalignment
        df.drop(columns=['DiscountDLC count'], inplace=True)        
        # Rename the columns based on the mapping to restore the correct column headers
        df = df.rename(columns=columns_to_change)

        tmp_path_local = "/opt/airflow/data/tmp_local.csv"
        df.to_csv(tmp_path_local, index=False)
        return tmp_path_local
    
    # Task 1.2: Scrape and extract upcoming games data
    @task
    def extract_upcoming() -> str:
        df = find_upcoming_games()
        if df.empty:
            raise ValueError("No upcoming games found. Aborting ETL pipeline.")        
        tmp_path_upcoming = "/opt/airflow/data/tmp_upcoming.csv"
        df.to_csv(tmp_path_upcoming, index=False)
        return tmp_path_upcoming
    
    # Task 2: Merge both datasets (local and upcoming), removing duplicates
    @task
    def merge_data(local_path: str, upcoming_path: str) -> str:
        df_local = pd.read_csv(local_path)
        df_upcoming = pd.read_csv(upcoming_path)
        df_combined = pd.concat([df_local, df_upcoming], ignore_index=True)
        df_combined.drop_duplicates(subset="AppID", inplace=True)
        tmp_path_merged = "/opt/airflow/data/tmp_merged.csv"
        df_combined.to_csv(tmp_path_merged, index=False)
        return tmp_path_merged

    # Task 3: Transform data by computing a new field: Positive Percentage
    @task
    def transform(merged_path: str) -> str:
        df = pd.read_csv(merged_path)
        df = df[COLUMNS_TO_SELECT]
        # Compute positive review percentage only if both values are available
        df["Positive Percentage"] = df.apply(
            lambda row: (row["Positive"] / (row["Positive"] + row["Negative"]) * 100)
            if (row["Positive"] + row["Negative"]) > 0 else np.nan,
            axis=1
        )
        tmp_path_transformed = "/opt/airflow/data/tmp_transformed.csv"
        df.to_csv(tmp_path_transformed, index=False)
        return tmp_path_transformed

    # Task 4: Load final DataFrame into a PostgreSQL database
    @task
    def load(transformed_path: str) -> bool:
        engine = create_engine(os.getenv("DATABASE_URL", "postgresql://user:password@postgres:5432/steamdb"))
        df = pd.read_csv(transformed_path)
        df.to_sql("steam_games", con=engine, if_exists="replace", index=False)
        return True

    # Task 5: Clean up temporary files created during the ETL process
    @task
    def cleanup_tmp_files(
        local_path: str, 
        upcoming_path: str, 
        combined_path: str, 
        transformed_path: str, 
        _fb: bool
    ):
        for path in [local_path, upcoming_path, combined_path, transformed_path]:
            if os.path.exists(path):
                os.remove(path)
        print(f'Feedback {_fb} has been recieved.')

    # Task orchestration
    games_path = download_steam_data()
    local_path = extract_local(games_path)
    upcoming_path = extract_upcoming()
    combined_path = merge_data(local_path, upcoming_path)
    transformed_path = transform(combined_path)
    feed_back = load(transformed_path)
    cleanup_tmp_files(local_path, upcoming_path, combined_path, transformed_path, feed_back)

# Register the DAG
etl_steam_games()
