FROM node:0.12.3

COPY server.js /app/server.js
COPY schedule.json /app/shedule.json
COPY package.json /app/package.json

RUN cd /app && npm install

EXPOSE 3000
VOLUME /data

# assumes the application is enhanced to get server.db as parameter
ENTRYPOINT node /app/server.js /data/server_votes.db
