#!/bin/bash

if [[ -z $BOX_ID ]]; then
    echo "BOX_ID unset, using cpuinfo Serial"
    export BOX_ID=`cat /proc/cpuinfo|grep Serial|cut -c 11-99`
fi
echo "BOX_ID=$BOX_ID"
exec env "BOX_ID=$BOX_ID" "$@"