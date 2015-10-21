FROM resin/rpi-raspbian:jessie

MAINTAINER BreizhCamp Team <team@breizhcamp.org>

RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential git libssl-dev python ca-certificates curl && \
    apt-get install -y python-dev python-pip wget && \
    pip install RPi.GPIO && \
    rm -rf /var/lib/apt/lists/*

RUN wget "http://node-arm.herokuapp.com/node_0.10.36_armhf.deb" \
  && dpkg -i "node_0.10.36_armhf.deb" \
  && rm "node_0.10.36_armhf.deb"

# TODO synchro timezone container / host

ADD / /opt/LikeBox/client

WORKDIR /opt/LikeBox/client

RUN npm install

ENTRYPOINT [ "node", "/opt/Likebox/client/client.js" ]
