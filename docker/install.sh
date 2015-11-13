#!/bin/bash
HERE=$(dirname $(readlink -f $0))

echo "rtc-ds1307" >> /etc/modules
echo "i2c-dev" >> /etc/modules
echo "i2c-bcm2708" >> /etc/modules

sed -i '/exit 0/d' /etc/rc.local
echo "echo ds1307 0x68 > /sys/class/i2c-adapter/i2c-1/new_device" >> /etc/rc.local
echo "hwclock -s" >> /etc/rc.local
echo "exit 0" >> /etc/rc.local

echo "dtparam=i2c1=on" >> /boot/config.txt
echo "dtparam=i2c_arm=on" >> /boot/config.txt
apt-get update
apt-get install i2c-tools

mkdir /opt/data
docker pull breizhcamp/likebox

cp $HERE/likebox.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable likebox.service
