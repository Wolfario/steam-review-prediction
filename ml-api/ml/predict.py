import pandas as pd
import mlflow
import joblib
from model_registry import get_latest_run_id

def preprocess(genres, categories, about, age, tfidf_genres, tfidf_categories, tfidf_about):
    # Transform input text using pre-trained TF-IDF vectorizers
    genres_input = tfidf_genres.transform([genres])
    categories_input = tfidf_categories.transform([categories])
    about_input = tfidf_about.transform([about])
    
    # Convert sparse vectors into DataFrames with appropriate column names
    genres_df = pd.DataFrame(genres_input.toarray(), columns=[f"genre_{g}" for g in tfidf_genres.get_feature_names_out()])
    categories_df = pd.DataFrame(categories_input.toarray(), columns=[f"cat_{c}" for c in tfidf_categories.get_feature_names_out()])
    about_df = pd.DataFrame(about_input.toarray(), columns=[f"about_{w}" for w in tfidf_about.get_feature_names_out()])
    age_df = pd.DataFrame([[age]], columns=["Required age"])
    
    # Concatenate all input features into a single DataFrame
    X = pd.concat([genres_df, categories_df, about_df, age_df], axis=1)
    return X

def predict(genres, categories, about, age):
    # Get latest run ID
    run_id = get_latest_run_id()
    
    # Construct path to artifacts
    experiment = mlflow.get_experiment_by_name("steam_rating_prediction")
    artifact_path = f"mlruns/{experiment.experiment_id}/{run_id}/artifacts/pipeline.pkl"
    
    # Load the entire pipeline
    pipeline = joblib.load(artifact_path)
    
    # Prepare input data
    input_data = pd.DataFrame({
        'Genres': [genres],
        'Categories': [categories],
        'About the game': [about],
        'Required age': [age]
    })
    
    # Make prediction
    prediction = pipeline.predict(input_data)[0]
    return round(prediction, 2)