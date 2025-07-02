import os
import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def get_db_connection():
    return create_engine(os.getenv("DATABASE_URL", "postgresql://user:password@postgres:5432/steamdb"))

def load_data(engine):
    query = '''
        SELECT "AppID", "Name", "Genres", "Categories" 
        FROM steam_games;
        '''
    return pd.read_sql(query, con=engine)

def preprocess(df):
    for col in ['Genres', 'Categories']:
        df[col] = df[col].fillna('').astype(str)
    
    def split_data_pandas(text):
        return ' '.join([x.strip().lower().replace(' ', '_') for x in text.split(',')])
    df['Genres'] = df['Genres'].apply(split_data_pandas)
    df['Categories'] = df['Categories'].apply(split_data_pandas)
    
    return df
    
def search_similar_games(genres, categories, top_n, genre_weight=0.7):
    engine = get_db_connection()
    df = preprocess(load_data(engine))
    
    # Vectorizers
    genre_vectorizer = TfidfVectorizer()
    cat_vectorizer = TfidfVectorizer()

    genre_matrix = genre_vectorizer.fit_transform(df['Genres'])
    cat_matrix = cat_vectorizer.fit_transform(df['Categories'])

    genres_clean_str = ' '.join(x.strip().lower().replace(' ', '_') for x in genres.split(','))
    categories_clean_str = ' '.join(x.strip().lower().replace(' ', '_') for x in categories.split(','))

    new_genre_vec = genre_vectorizer.transform([genres_clean_str])
    new_cat_vec = cat_vectorizer.transform([categories_clean_str])

    # Compute cosine similarity
    genre_sim = cosine_similarity(new_genre_vec, genre_matrix)[0]
    cat_sim = cosine_similarity(new_cat_vec, cat_matrix)[0]

    # Weighted combination
    combined_sim = genre_weight * genre_sim + (1 - genre_weight) * cat_sim

    # Get top N
    top_indices = np.argsort(combined_sim)[::-1][:top_n]
    result_df = df.iloc[top_indices][['AppID', 'Name']].copy()
    result_df['Similarity'] = combined_sim[top_indices]
    result_df['Similarity'] = result_df['Similarity'].round(2)

    return result_df.to_dict(orient='records')
