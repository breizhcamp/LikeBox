FROM node:0.12.3

ADD / /app/

RUN cd /app && npm install

EXPOSE 3000
VOLUME /data
ENV DATA_DIR=/data

# URL to download conference schedule on startup
ENV SCHEDULE_URL=http://dockerconeu2015.sched.org/api/session/list?api_key=cd5a8871cb3bc3bc8a732d2b3e30bf39&format=json

WORKDIR /app
ENTRYPOINT node /app/server.js
