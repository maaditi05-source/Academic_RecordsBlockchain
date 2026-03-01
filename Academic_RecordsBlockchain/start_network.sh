#!/bin/bash
sudo -S env PATH="$HOME/fabric-bin/bin:$PATH" ./network.sh up < <(echo "1003")
