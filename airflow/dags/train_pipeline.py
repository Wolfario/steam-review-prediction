from airflow.decorators import dag, task
from datetime import datetime
import sys

# Add the custom ML module directory to the Python path so we can import `train.py`
sys.path.append('/opt/airflow/ml')

# Import the train function defined in train.py
from train import train

# Define the Airflow DAG for training the model
@dag(schedule=None, start_date=datetime(2025, 5, 1), catchup=False)
def train_pipeline():

    @task
    def run_train():
        train()

    run_train()

dag = train_pipeline()
