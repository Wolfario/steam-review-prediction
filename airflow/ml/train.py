import os
import mlflow
import joblib
import mlflow.sklearn
import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import mean_absolute_error


mlflow.set_experiment("steam_rating_prediction")

def get_db_connection():
    return create_engine(os.getenv("DATABASE_URL", "postgresql://user:password@postgres:5432/steamdb"))

def load_data(engine):
    query = 'SELECT "AppID", "Name", "Required age", "About the game", "Genres", "Categories", "Positive Percentage" FROM steam_games WHERE "Positive Percentage" IS NOT NULL;'
    df = pd.read_sql(query, con=engine)
    return df

def preprocess(df):
    df['Required age'] = df['Required age'].fillna(0)
    df['About the game'] = df['About the game'].fillna('').astype(str)
    
    for col in ['Genres', 'Categories']:
        df[col] = df[col].fillna('').astype(str)

    tfidf_genres = TfidfVectorizer(
        tokenizer=lambda x: [s.strip() for s in x.split(',')],
        token_pattern=None,
        max_features=50
    )
    tfidf_categories = TfidfVectorizer(
        tokenizer=lambda x: [s.strip() for s in x.split(',')],
        token_pattern=None,
        max_features=50
    )
    tfidf_about = TfidfVectorizer(
        max_features=200,
        stop_words='english'
    )

    genres_encoded = tfidf_genres.fit_transform(df['Genres'])
    categories_encoded = tfidf_categories.fit_transform(df['Categories'])
    about_encoded = tfidf_about.fit_transform(df['About the game'])

    genres_df = pd.DataFrame(genres_encoded.toarray(), columns=[f"genre_{g}" for g in tfidf_genres.get_feature_names_out()])
    categories_df = pd.DataFrame(categories_encoded.toarray(), columns=[f"cat_{c}" for c in tfidf_categories.get_feature_names_out()])
    about_df = pd.DataFrame(about_encoded.toarray(), columns=[f"about_{w}" for w in tfidf_about.get_feature_names_out()])

    numeric_features = df[['Required age']].reset_index(drop=True)
    X = pd.concat([genres_df, categories_df, about_df, numeric_features], axis=1)
    y = df['Positive Percentage'].reset_index(drop=True)

    return X, y, tfidf_genres, tfidf_categories, tfidf_about

def train():
    engine = get_db_connection()

    df = load_data(engine)
    X, y, tfidf_genres, tfidf_categories, tfidf_about = preprocess(df)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)

    mlflow.set_tracking_uri("http://mlflow:5000")
    run_name = f"rf_run_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}"
    with mlflow.start_run(run_name=run_name):
        mlflow.log_param("model_type", "RandomForestRegressor")
        mlflow.log_metric("mae", mae)
        mlflow.sklearn.log_model(model, "model")
        
        # Save vectorizers locally
        joblib.dump(tfidf_genres, "tfidf_genres.pkl")
        joblib.dump(tfidf_categories, "tfidf_categories.pkl")
        joblib.dump(tfidf_about, "tfidf_about.pkl")

        # Log as MLflow artifacts
        mlflow.log_artifact("tfidf_genres.pkl")
        mlflow.log_artifact("tfidf_categories.pkl")
        mlflow.log_artifact("tfidf_about.pkl")
    
if __name__ == "__main__":
    train()