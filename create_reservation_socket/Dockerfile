FROM node
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY ./package*.json ./
COPY ./.env ./
COPY . .
#RUN npm ci --omit=dev
RUN npm install
RUN npm run build
EXPOSE 5010
CMD [ "npm", "start" ]