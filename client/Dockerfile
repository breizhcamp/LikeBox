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

RUN echo Europe/Paris > /etc/timezone && dpkg-reconfigure --frontend noninteractive tzdata

ADD package.json /opt/LikeBox/client/package.json
ADD npm-shrinkwrap.json /opt/LikeBox/client/npm-shrinkwrap.json
WORKDIR /opt/LikeBox/client
RUN npm install

ADD client.js /opt/LikeBox/client/client.js
ADD modules /opt/LikeBox/client/modules
ADD entrypoint.sh /opt/LikeBox/client/entrypoint.sh

ENTRYPONT ["/opt/LikeBox/client/entrypoint.sh"]
CMD [ "node", "/opt/LikeBox/client/client.js" ]
