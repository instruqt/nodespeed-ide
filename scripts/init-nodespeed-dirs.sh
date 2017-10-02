#!/bin/bash

# set the permissions on the directories used byBrckets to be owned by the nodespeed user
echo "Setting permissions for nodespeed..."
sudo chown -R nodespeed:nodespeed /projects
sudo chown -R nodespeed:nodespeed /home/nodespeed
sudo chown -R nodespeed:nodespeed /tmp

mkdir -p /home/nodespeed/tmp

echo "Set permissions for nodespeed."

