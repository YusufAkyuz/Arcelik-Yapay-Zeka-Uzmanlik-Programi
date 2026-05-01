# AWS Lambda için optimize edilmiş Python 3.10 base imajı
FROM public.ecr.aws/lambda/python:3.10

# Bağımlılıkları kopyala
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Python kütüphanelerini yükle
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama kodlarını ve konfigürasyon dosyalarını kopyala
COPY app/ ${LAMBDA_TASK_ROOT}/app/
COPY config/ ${LAMBDA_TASK_ROOT}/config/
COPY app.py ${LAMBDA_TASK_ROOT}

# Lambda'nın tetikleneceği giriş noktasını (Handler) belirle
CMD [ "app.handler" ]
