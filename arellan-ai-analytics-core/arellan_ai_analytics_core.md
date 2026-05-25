# arellan-ai-analytics-core — Núcleo de Analítica con IA (Fase 3)

Modelos de inteligencia artificial y machine learning para el ecosistema Arellan Hnos. Enfocado en detección de anomalías financieras, predicción de demanda de repuestos y análisis de patrones operativos.

## Estado: Fase 3 (no activo en MVP ni Fase 2)

Este módulo se activa cuando el ecosistema tenga suficiente historial de datos (mínimo 12 meses de operación) para entrenar modelos con significancia estadística.

## Casos de Uso Planificados

### 1. Detección de Anomalías Financieras
Detectar automáticamente patrones que sugieran fraude o irregularidades:

```python
# Modelo: Isolation Forest para detección de outliers en transacciones
from sklearn.ensemble import IsolationForest
import pandas as pd

# Features por transacción:
features = [
  'amount',                    # Monto de la transacción
  'hour_of_day',               # Hora del día
  'day_of_week',               # Día de la semana
  'time_since_last_transaction',  # Tiempo desde la última transacción del mismo usuario
  'deviation_from_user_avg',   # Desviación respecto al promedio del usuario
  'is_manual_override',        # Si fue un ajuste manual
]

model = IsolationForest(
  contamination=0.05,  # Esperamos ~5% de transacciones anómalas
  random_state=42
)

# El modelo se entrena con 6+ meses de transacciones históricas normales
# Score: -1 = anomalía, 1 = normal
anomaly_scores = model.fit_predict(transaction_features)
```

### 2. Predicción de Demanda de Repuestos
Anticipar qué repuestos necesitarán reposición en las próximas 2 semanas:

```python
# Time series forecasting con Prophet (Facebook)
from prophet import Prophet

# Input: historial de salidas de inventario por ítem
# Output: predicción de demanda para los próximos 14 días

def forecast_part_demand(item_id: str, days_ahead: int = 14):
  history = get_item_movement_history(item_id)

  model = Prophet(
    seasonality_mode='multiplicative',
    weekly_seasonality=True,
    yearly_seasonality=True,
  )
  model.fit(history)

  future = model.make_future_dataframe(periods=days_ahead)
  forecast = model.predict(future)

  return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(days_ahead)
```

### 3. OCR de Placas Vehiculares
Lectura automática de la placa del vehículo al ingreso al taller:

```python
# Usando Tesseract OCR + OpenCV o AWS Rekognition
import pytesseract
import cv2

def extract_plate_from_image(image_path: str) -> str:
  img = cv2.imread(image_path)

  # Preprocesamiento: grayscale, umbralización, eliminación de ruido
  gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
  thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

  # Extracción del texto
  text = pytesseract.image_to_string(
    thresh,
    config='--psm 7 --oem 3 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-'
  )

  return text.strip()
```

## Pipeline de ML

```
[Datos históricos PostgreSQL]
        ↓
[Extracción (ETL — arellan-data-pipeline)]
        ↓
[Feature Engineering (Python scripts)]
        ↓
[Entrenamiento del modelo (Jupyter + scikit-learn/Prophet)]
        ↓
[Serialización del modelo (joblib/pickle)]
        ↓
[Serving vía endpoint NestJS] ← consume arellan-platform
        ↓
[Alertas y predicciones en dashboard]
```

## Infraestructura (Fase 3)

- **Entrenamiento:** AWS SageMaker o scripts locales en Mac Mini (228 GB SSD disponible)
- **Serving:** endpoint Python (FastAPI) llamado desde NestJS o modelos embebidos en workers
- **Monitoreo de drift:** verificación mensual de métricas del modelo contra datos nuevos
