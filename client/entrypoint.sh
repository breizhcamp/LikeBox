#!/bin/bash

if [[ -z BOX_ID ]] then
    export BOX_ID=`cat /proc/cpuinfo|grep Serial|cut -d ':' -f 2`
fi
exec "$@"