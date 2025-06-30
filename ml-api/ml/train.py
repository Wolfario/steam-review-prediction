import os
import mlflow
import joblib
import tempfile
import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import mean_absolute_error
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer

def get_db_connection():
    return create_engine(os.getenv("DATABASE_URL", "postgresql://user:password@postgres:5432/steamdb"))

def load_data(engine):
    query = 'SELECT "AppID", "Name", "Required age", "About the game", "Genres", "Categories", "Positive Percentage" FROM steam_games WHERE "Positive Percentage" IS NOT NULL;'
    return pd.read_sql(query, con=engine)

def comma_tokenizer(text):
    return [s.strip() for s in text.split(',')]

def preprocess(df):
    df['Required age'] = df['Required age'].fillna(0)
    df['About the game'] = df['About the game'].fillna('').astype(str)
    for col in ['Genres', 'Categories']:
        df[col] = df[col].fillna('').astype(str)
    return df

def train():
    # Set MLflow tracking
    mlflow.set_tracking_uri("http://mlflow:5000")
    mlflow.set_experiment("steam_rating_prediction")
    
    # Load and preprocess data
    engine = get_db_connection()
    df = preprocess(load_data(engine))
    
    # Define preprocessing transformers
    text_transformer = ColumnTransformer([
        ('genres_tfidf', TfidfVectorizer(
            tokenizer=comma_tokenizer,
            token_pattern=None,
            max_features=50
        ), 'Genres'),
        ('categories_tfidf', TfidfVectorizer(
            tokenizer=comma_tokenizer,
            token_pattern=None,
            max_features=50
        ), 'Categories'),
        ('about_tfidf', TfidfVectorizer(
            max_features=200,
            stop_words='english'
        ), 'About the game')
    ])
    
    # Create full pipeline
    pipeline = Pipeline([
        ('preprocessor', text_transformer),
        ('regressor', RandomForestRegressor(n_estimators=5, random_state=42))
    ])
    
    # Split data
    X = df[['Genres', 'Categories', 'About the game', 'Required age']]
    y = df['Positive Percentage']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
    
    # Train model
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    y_pred = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
       
    # Log to MLflow
    with mlflow.start_run(run_name=f"rf_run_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}"):
        mlflow.log_param("model_type", "RandomForestRegressor")
        mlflow.log_metric("mae", mae)

        # Create temporary directory for model saving
        with tempfile.TemporaryDirectory() as tmp_dir:
            joblib.dump(pipeline, os.path.join(tmp_dir, "pipeline.pkl"))
            mlflow.log_artifact(os.path.join(tmp_dir, "pipeline.pkl"))
        
if __name__ == "__main__":
    train()