from fastapi import FastAPI, Request
from pydantic import BaseModel
import sys
from predict import predict

app = FastAPI()

class GameData(BaseModel):
    genres: str
    categories: str
    about: str
    age: int

@app.post("/predict")
def make_prediction(data: GameData):
    result = predict(data.genres, data.categories, data.about, data.age)
    return {"prediction": result}