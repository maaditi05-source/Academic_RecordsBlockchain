#!/bin/bash
sudo -S ./network.sh down < <(echo "1003")
sudo -S bash -c 'docker rm -f $(docker ps -aq) 2>/dev/null || true' < <(echo "1003")
sudo -S bash -c 'docker volume rm $(docker volume ls -q) 2>/dev/null || true' < <(echo "1003")
sudo -S rm -rf organizations/ system-genesis-block/ channel-artifacts/ data/ < <(echo "1003")
sudo -S env PATH="$HOME/fabric-bin/bin:$PATH" ./network.sh up < <(echo "1003")
