FROM node:18-slim
RUN groupadd -r user && useradd -r -g user user
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*
RUN pip3 install psycopg2-binary --break-system-packages
RUN mkdir -p /tmp/storage-fs && chmod -R 777 /tmp/storage-fs
WORKDIR /usr/src/app
COPY package.json package-lock.json /usr/src/app/
RUN npm install
COPY . /usr/src/app/
USER user
EXPOSE 5001
CMD ["node", "index.js"]