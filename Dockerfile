FROM python:3.11-slim

WORKDIR /app

# Prevent Python from writing .pyc files & buffer output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Set dynamic port
ENV PORT=5001
EXPOSE 5001

CMD ["sh", "-c", "gunicorn --workers=2 --bind=0.0.0.0:${PORT:-5001} app:app"]
