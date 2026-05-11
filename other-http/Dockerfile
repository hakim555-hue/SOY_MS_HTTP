FROM node:18-slim
RUN groupadd -r user && useradd -r -g user user
ENV NPM_CONFIG_CACHE=/tmp/.npm
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json package-lock.json /usr/src/app/
RUN npm install --production
COPY . /usr/src/app/
RUN chown -R user:user /usr/src/app
USER user
EXPOSE 5001
CMD ["node", "index.js"]