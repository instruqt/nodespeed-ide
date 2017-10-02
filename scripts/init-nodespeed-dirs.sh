#!/bin/bash

# set the permissions on the directories used byBrckets to be owned by the nodespeed user
sudo chown -R nodespeed:nodespeed /projects
sudo chown -R nodespeed:nodespeed /home/nodespeed

mkdir -p /home/nodespeed/tmp


