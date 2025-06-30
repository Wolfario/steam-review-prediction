from fastapi import FastAPI, Request, BackgroundTasks
from pydantic import BaseModel
from predict import predict
from train import train
from model_registry import get_latest_successful_run

app = FastAPI()

class GameData(BaseModel):
    genres: str
    categories: str
    about: str
    age: int

@app.post("/train")
def start_training(background_tasks: BackgroundTasks):
    background_tasks.add_task(train)
    return {"status": "training_started"}

@app.get("/status")
def get_status():
    run = get_latest_successful_run()
    if not run:
        return {"status": "not_ready"}
    return {
        "status": "ready",
        "run_id": run.info.run_id,
        "timestamp": run.info.start_time
    }

@app.post("/predict")
def make_prediction(data: GameData):
    result = predict(data.genres, data.categories, data.about, data.age)
    return {"prediction": result}
