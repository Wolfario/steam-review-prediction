FROM python:3.9-slim
COPY . .
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
