FROM node
WORKDIR /usr/src/app
COPY ./dist ./dist
COPY ./package*.json ./
COPY ./.env ./
RUN npm install
RUN npm ci --omit=dev
COPY . .
EXPOSE 5012
CMD [ "npm", "start" ]
