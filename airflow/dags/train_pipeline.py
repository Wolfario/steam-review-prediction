from airflow.decorators import dag, task
from datetime import datetime
import sys

# Append /opt/airflow/ml to correctly access train.py file
sys.path.append('/opt/airflow/ml')
from train import train

@dag(schedule=None, start_date=datetime(2025, 5, 1), catchup=False)
def train_pipeline():

    @task
    def run_train():
        train()

    run_train()

dag = train_pipeline()
