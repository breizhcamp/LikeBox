
# Carte SD

Prendre la dernière image basée sur la distribution Debian Jessie :
http://blog.hypriot.com/downloads/

RC1 le 9/9/2015 -> http://downloads.hypriot.com/hypriot-rpi-20150909-070022.img.zip
Contient kernel 4.1.6 + Docker 1.8.1

# Mise à jour docker

Pré-requis : booter la RPi sur la RC1 avec une connexion réseau

```
wget http://downloads.hypriot.com/docker-hypriot_1.8.2-1_armhf.deb
sudo dpkg -i docker-hypriot_1.8.2-1_armhf.deb
```

# Activer l'i2c

Ajouter dans le fichier /etc/modules les modules i2c :
```
i2c-bcm2708 
i2c-dev
```

# Lancement du container

docker run --cap-add SYS_RAWIO --device /dev/i2c-1 --device /dev/mem -ti -v /sys:/sys <nom_image>

- /dev/mem requis par du code de configuration de résistances de pullup des GPIO
- /dev/i2c-1 requis pour l'ecran LCD
- volume /sys requis pour atteindre les GPIO via sysfs (module node onoff)

# Reste à faire

Configurer la carte RTC et synchroniser le timezone avec le container.
