from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from predict import predict
import sys


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GameData(BaseModel):
    genres: str
    categories: str
    about: str
    age: int


@app.post("/predict")
def make_prediction(data: GameData):
    result = predict(data.genres, data.categories, data.about, data.age)
    return {"prediction": result}
