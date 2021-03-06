[![Codefresh build status]( https://g.codefresh.io/api/badges/build?repoOwner=whoGloo&repoName=nodespeed-ide&branch=nodespeed-master&pipelineName=nodespeed-ide&accountName=asthomasdk&type=cf-1)]( https://g.codefresh.io/repositories/whoGloo/nodespeed-ide/builds?filter=trigger:build;branch:nodespeed-master;service:5a325734ae579a0001585094~nodespeed-ide)

# nodeSpeed IDE
nodeSpeed IDE is a server for providing hosted version of the popular code editor [Brackets](http://brackets.io/). 

nodeSpeed IDE is initially based on the [Brackets Server](https://github.com/rabchev/brackets-server) project. Thanks to [Boyan Rabchev](https://github.com/rabchev) for starting this project. As it is no longer being actively maintained, we have decided to launch our fork as a project with a new name.  

nodeSpeed IDE uses a node.js Express server and includes an implementation of [xterm.js](https://github.com/sourcelair/xterm.js/) toprovide browser based terminal access. 

The Brackets code editor can be loaded directly in a web browser. It doesn’t require additional installations or browser extensions. Brackets works just like the desktop version, except that all projects and files reside on the server instead of the local file system. 

nodeSpeed IDE is mainly intended to be used with an implementation with Docker containers, making it fast and easy to spin up and run a hosted development environment. All of our testing is therefore done by running in a Docker environment. 

nodeSpeed IDE is currently based on Brackets 1.8. To check the current verion of Brackets source used in the server, please see [CHANGELOG](https://github.com/whoGloo/nodespeed-ide/blob/master/CHANGELOG.md).

## Installation
Install the nodeSpeed IDE with one of the following options: 
- By cloning building and runinng
- By building a docker image and running the IDE from one or more containers using Docker
- By pulling and running a pre-built Docker image `whogloo/nodespeed-ide` and using this in `docker run` scripts.

## Usage Examples
### Command line
To start from command line, use a command like the one below from the IDE installation directory: 

```
node nodespeedide --supp-dir /projects/.brackets-server -j /projects
```

**IMPORTANT:** Make sure the **/projects** directory exists.

All arguments are optional.

| Short Option | Long Option      | Default Value             | Description
|--------------|------------------|---------------------------|------------------------------------------------------------
| `-p <prot>`  | `--port`         | `6800`                    | TCP port on which Brackets server is listening.
| `-j <dir>`   | `--proj-dir`     | `/projects `              | Root directory for projects. Directories above this root cannot be accessed.
| `-s <dir>`   | `--supp-dir`     | `/projects/.brackets-srv` | Root directory for Brackets supporting files such as user extensions, configurations and state persistence.
| `-d`         | `--user-domains` | `false`                   | Allows Node domains to be loaded from user extensions.

**NOTE:** Some Brackets extensions require external Node.js process, called node domain. Node domains run on the server, thereby allowing arbitrary code to be executed on the server through custom extensions.  Since this imposes very serious security and stability risks, Brackets Server will not load nor execute domains from user extensions, unless `-d` option is specified.

**NOTE:** The default values for `projectsDir` and `supportDir` are different when nodeSpeed IDE is initiated from code. They are respectively `./projects` and `./brackets`, relative to the current working directory.

Options:

| Option           | Default Value     | Description
|------------------|-------------------|------------------------------------------------------------
| httpRoot         | `/brackets`       | Defines the root HTTP endpoint for Brackets Server (http://yourdomain.com/brackets).
| projectsDir      | `./projects`      | Root directory for projects. Directories above this root cannot be accessed.
| supportDir       | `./brackets`      | Root directory for Brackets supporting files such as user extensions, configurations and state persistence.
| allowUserDomains | `false`           | Allows Node domains to be loaded from user extensions.

### From Docker
To run from Docker, the following steps are needed. 

##### Docker Image
Build image of nodeSpeed IDE using the Dockerfile included in the project and and the files in the `docker`sub-directory 

or  

Pull a pre-built image from [whogloo/nodespeed-ide](https://hub.docker.com/r/whogloo/nodespeed-ide/) on Docker Hub. 

#### Run with Docker 

Create a data container to store code and files so that they are not lost during updates of the image: 

```
docker create --name nodespeed-ide-data -v /projects -v /projects/.brackets-server -v /home/nodespeed -v /tmp busybox
```

Set directory permissions
 ```
 docker run -it --rm --volumes-from nodespeed-ide-data whogloo/nodespeed-ide /bin/bash -c "/var/brackets-server/scripts/init-nodespeed-dirs.sh"
 ```

Run nodeSpeed IDE with Docker from the command line: 

 ``` 
 docker run -d --name nodespeed-ide --volumes-from nodespeed-ide-data -p 6800:6800 -p 8080:8080 -p 3000:3000 -p 9485:9485 whogloo/nodespeed-ide 
 ```
 
 **NB: ** The following ports must be exposed from the Docker container: 
 
 - `6800` Default IDE port
 - `8080` Terminal Port 
 - `3000` Port for testing applicatiosn running inside the container
 - `9485` Web Sockets access for terminal instance

The IDE can now be accessed from `http://localhost:6800`. If you are running docker with a reverse proxy or load balancer, the URL will be different. 

## Suggested Brackets extensions
As part of the hosted version of nodeSpeed IDE (nodeSpeed Development), a number of Brackets extensions have been developed or forked and updated to work in the nodeSpeed IDE. These extensions add extra functionality to the IDE in various ways. 

The following is a list of suggested nodeSpeed IDE specific extensions: 

- [**brackets-nodespeed-custom**](https://github.com/whoGloo/brackets-nodespeed-custom): This is our main custom project and it adds extra menu items to the IDE, including extra navigation menu items for **Terminal** (nodeSpeed Terminal in a separate browser tab) and **Preview** (preview of applications run from the IDE using port 3000). 
- [**nodespeed-terminal**](https://github.com/whoGloo/nodespeed-terminal): Node Express project with Golden Layout used to implement a multi instance terminal that can run in a separate tab browser, attaching to the bash shell of the IDE machine (normally a Docker container). 
With this extension installed, a terminal can be accessed from the browser. For example: `http://localhost:8080`. 
- [**brackets-file-upload**](https://github.com/whoGloo/brackets-file-upload): Extension to provide upload and download of files and directories from the IDE
- [**brackets-duplicate-extension**](https://github.com/whoGloo/brackets-duplicate-extension): Extension to provide support for copying and duplicating files and folders

Custom forks of existing Brackets Extensions: 
- [**brackets-git**](https://github.com/whoGloo/brackets-git): Custom fork of [brackets-git](https://github.com/zaggino/brackets-git). Kudos to [Martin Zagora](https://github.com/zaggino). 
- [**brackets-npm-extension**](https://github.com/whoGloo/brackets-npm-registry): Custom fork of [brackets-npm-registry](https://github.com/zaggino/brackets-npm-registry). Kudos to [Martin Zagora](https://github.com/zaggino). 

It has been necessary to modify some of the extensions for them to work with the IDE, as many of the existing extensions are dependent on local OS and filesystem features. 

There are several other extensions that could be recommended for a productive implementation of nodeSpeed IDE. Suggestions are welcome. 

Some of the extensions above may have dependencices on environment variables or other settings used for nodeSpeed IDE internally at whoGloo. If there are issues with getting any of them to work, please log issues with the appropriate projects so that they can be looked at. PRs are more than welcome for the main project and any of the extensions projects.  

### Installation
The extensions above have not been pubished to the Brackets extensions registry. They will therefore not show up in the extension manager. 

They can easily be installed using git from a terminal session or in a bash session from `docker exec`. 

For example: 

```
cd /projects/.brackets-server/extensions/user

git clone https://github.com/whoGloo/brackets-nodespeed-custom
cd brackets-nodespeed-custom
npm install

```
Remember to restart nodeSpeed IDE after installing extensions manually in this way. 

#### Quick install of extensions in Docker based installations
For those using the Docker based instructions above, the suggested extensions above can also be installed by running an included script: 

 ```
 docker run -it --rm --volumes-from nodespeed-ide-data whogloo/nodespeed-ide /bin/bash -c "/var/brackets-server/scripts/install-extensions.sh"
 ```

Restart any running nodeSpeed IDE containers after this to activate the extensions. 

## Custom User keymap
There are a number of keyboard conflicts when using nodeSpeed IDE in a web browser. The following custom contents can be used as a starting point for custom settings. 

```

{
    "documentation": "https://github.com/adobe/brackets/wiki/User-Key-Bindings",

    "overrides": {
        "Alt-N": "file.newDoc",
        "Alt-O":   "file.open",
        "Alt-W": "file.close",
        "Shift-Alt-O": "file.openFolder",
        "Shift-Alt-W": "file.close_all",
        "Shift-Alt-L": "edit.splitSelIntoLines",
        "Alt-/": "edit.lineComment",
        "Shift-Alt-/": "edit.blockComment",
        "Alt-T": "navigate.gotoDefinition",
        "Alt-J": "navigate.jumptoDefinition",
        "Ctrl-Up": "navigate.nextDoc",
        "Ctrl-Down": "navigate.prevDoc",
        "Alt-Q": "navigate.toggleQuickEdit",
        "Alt-K": "navigate.toggleQuickDocs",
        "Shift-F1": "help.support",
        "Alt-Up": "cmd.findPrevious",
        "Alt-Down": "cmd.findNext"
    }
}

``` 

# Contributing
Please review issue for this project and if you don't find an existing issue that covers what you are looking for - feel free to log one. We welcome bug reports, suggestions for new or changed features and even more - PRs from those brave enough to contribute working changes.  

Please see [`CONTRIBUTING.md`](https://github.com/whoGloo/nodespeed-ide/blob/master/CONTRIBUTING.md)

# License
MIT License

Copyright (c) 2017 whoGloo, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


nodeSpeed is a registered trademark of [whoGloo, Inc.](https://whogloo.com). 
