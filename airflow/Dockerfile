FROM apache/airflow:2.7.3
COPY requirements.txt /opt/airflow/requirements.txt
COPY kaggle.json /opt/airflow/kaggle.json
RUN pip install --upgrade pip \
    && pip install -r /opt/airflow/requirements.txt \
    && mkdir -p ~/.kaggle \
    && cp /opt/airflow/kaggle.json ~/.kaggle/kaggle.json \
    && chmod 600 ~/.kaggle/kaggle.json