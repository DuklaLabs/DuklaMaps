FROM python:3.12-slim

WORKDIR /app

# Instalace Czech locale (potřeba pro locale.setlocale v getTimetableData.py)
RUN apt-get update && apt-get install -y locales \
    && sed -i '/cs_CZ.UTF-8/s/^# //g' /etc/locale.gen \
    && locale-gen \
    && rm -rf /var/lib/apt/lists/*

# Závislosti nainstalujeme jako první vrstvu (cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Zkopírujeme zbytek kódu
COPY . .

# Adresáře pro runtime data
RUN mkdir -p timetableData

# Port, na kterém Flask/gunicorn naslouchá
EXPOSE 5000

# Gunicorn spustí aplikaci; background sync vlákno se spustí uvnitř app.py
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--timeout", "120", "app:app"]
