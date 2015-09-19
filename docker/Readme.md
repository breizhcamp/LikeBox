
# Carte SD

Prendre la dernière image basée sur la distribution Debian Jessie :
http://blog.hypriot.com/downloads/

RC1 le 9/9/2015 -> http://downloads.hypriot.com/hypriot-rpi-20150909-070022.img.zip
Contient kernel 4.1.6 + Docker 1.8.1

# Mise à jour docker

Pré-requis : booter la RPi sur la RC1 avec une connexion réseau

wget http://downloads.hypriot.com/docker-hypriot_1.8.2-1_armhf.deb
sudo dpkg -i docker-hypriot_1.8.2-1_armhf.deb
