import os
import joblib
import pandas as pd
import mlflow
import mlflow.sklearn
from mlflow.tracking import MlflowClient

# Set up tracking URI and experiment name
mlflow.set_tracking_uri("http://mlflow:5000")
EXPERIMENT_NAME = "steam_rating_prediction"

def get_latest_run_id():
    client = MlflowClient()
    experiment = client.get_experiment_by_name(EXPERIMENT_NAME)
    if experiment is None:
        raise ValueError(f"Experiment '{EXPERIMENT_NAME}' not found.")    

    # Get all metadata about latest run of training
    runs = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        order_by=["start_time DESC"],
        max_results=1,
        filter_string="attributes.status = 'FINISHED'"
    )

    if not runs:
        raise ValueError("No successful runs found.")
    return runs[0].info.run_id

def load_artifacts(run_id):
    model = mlflow.sklearn.load_model(f"runs:/{run_id}/model")
    tfidf_genres = joblib.load(mlflow.artifacts.download_artifacts(run_id=run_id, artifact_path="tfidf_genres.pkl"))
    tfidf_categories = joblib.load(mlflow.artifacts.download_artifacts(run_id=run_id, artifact_path="tfidf_categories.pkl"))
    tfidf_about = joblib.load(mlflow.artifacts.download_artifacts(run_id=run_id, artifact_path="tfidf_about.pkl"))
    return model, tfidf_genres, tfidf_categories, tfidf_about


def preprocess(genres, categories, about, age, tfidf_genres, tfidf_categories, tfidf_about):
    genres_input = tfidf_genres.transform([genres])
    categories_input = tfidf_categories.transform([categories])
    about_input = tfidf_about.transform([about])
    
    genres_df = pd.DataFrame(genres_input.toarray(), columns=[f"genre_{g}" for g in tfidf_genres.get_feature_names_out()])
    categories_df = pd.DataFrame(categories_input.toarray(), columns=[f"cat_{c}" for c in tfidf_categories.get_feature_names_out()])
    about_df = pd.DataFrame(about_input.toarray(), columns=[f"about_{w}" for w in tfidf_about.get_feature_names_out()])
    age_df = pd.DataFrame([[age]], columns=["Required age"])
    
    X = pd.concat([genres_df, categories_df, about_df, age_df], axis=1)
    return X

def predict(genres, categories, about, age):
    run_id = get_latest_run_id()
    model, tfidf_genres, tfidf_categories, tfidf_about = load_artifacts(run_id)
    X = preprocess(genres, categories, about, age, tfidf_genres, tfidf_categories, tfidf_about)
    prediction = model.predict(X)[0]
    return round(prediction, 2)