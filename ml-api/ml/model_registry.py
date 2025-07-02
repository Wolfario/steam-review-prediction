import mlflow
from mlflow.tracking import MlflowClient
import joblib

mlflow.set_tracking_uri("http://mlflow:5000")
EXPERIMENT_NAME = "steam_rating_prediction"
client = MlflowClient()

def get_experiment():
    experiment = client.get_experiment_by_name(EXPERIMENT_NAME)
    if experiment is None:
        raise ValueError(f"Experiment '{EXPERIMENT_NAME}' not found.")
    return experiment

def get_latest_successful_run():
    experiment = get_experiment()
    if not experiment:
        return None

    runs = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        order_by=["start_time DESC"],
        max_results=1,
        filter_string="attributes.status = 'FINISHED'"
    )

    if not runs:
        return None
    return runs[0]

def get_latest_run_id():
    run = get_latest_successful_run()
    if not run:
        raise ValueError("No successful runs found.")
    return run.info.run_id

def is_model_ready():
    return get_latest_successful_run() is not None

def load_artifacts(run_id):
    model = mlflow.sklearn.load_model(f"runs:/{run_id}/model")
    tfidf_genres = joblib.load(mlflow.artifacts.download_artifacts(run_id=run_id, artifact_path="tfidf_genres.pkl"))
    tfidf_categories = joblib.load(mlflow.artifacts.download_artifacts(run_id=run_id, artifact_path="tfidf_categories.pkl"))
    tfidf_about = joblib.load(mlflow.artifacts.download_artifacts(run_id=run_id, artifact_path="tfidf_about.pkl"))
    return model, tfidf_genres, tfidf_categories, tfidf_about