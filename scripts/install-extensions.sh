#!/bin/bash

# Install the default recommended extensions for nodeSpeed IDE
echo "Installing default nodedSpeed IDE extensions installed."

cd /projects/.brackets-server/extensions/user

git clone https://github.com/whoGloo/brackets-nodespeed-custom
cd brackets-nodespeed-custom
npm install

cd ..
git clone https://github.com/whoGloo/nodespeed-terminal
cd nodespeed-terminal
npm install

cd ..
git clone https://github.com/whoGloo/brackets-file-upload
cd brackets-file-upload
npm install

cd ..
git clone https://github.com/whoGloo/brackets-duplicate-extension
cd brackets-duplicate-extension
npm install

cd ..
git clone https://github.com/whoGloo/brackets-git
cd brackets-git
npm install

echo "Default nodedSpeed IDE extensions installed."
