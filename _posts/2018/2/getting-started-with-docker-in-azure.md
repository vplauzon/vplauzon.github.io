---
title: Getting started with Docker Containers in Azure
date: 2018-04-24 03:30:54 -07:00
permalink: /2018/04/24/getting-started-with-docker-in-azure/
categories:
- Solution
tags:
- Containers
---
<a href="http://vincentlauzon.files.wordpress.com/2018/04/abandoned-building-architecture-building-783942.jpg"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="abandoned-building-architecture-building-783942" src="http://vincentlauzon.files.wordpress.com/2018/04/abandoned-building-architecture-building-783942_thumb.jpg" alt="abandoned-building-architecture-building-783942" width="320" height="213" align="left" border="0" /></a>Let’s get started with Docker on Azure.

We’ll play a little with Docker Containers.  In our <a href="https://vincentlauzon.com/2018/04/04/overview-of-docker-containers-in-azure/">container overview</a> we’ve done a tour of the different container managed services.

For a first hands on trial, we’ll go a little more low level and use Docker on a VM.  We’ll play with Docker on a single VM:  no cluster, no orchestrator, just containers.

In Azure the easiest is to install a ready-made VM image.  We can either use an image from the Azure Marketplace (e.g. <a href="https://azuremarketplace.microsoft.com/en-us/marketplace/apps/docker.docker-ce">Docker CE</a>) or the <a href="https://azuremarketplace.microsoft.com/en-us/marketplace/apps/microsoft.docker-arm">Docker extension</a> on any VM.  We recommend trying the templates we’ve put forward in <a href="https://vincentlauzon.com/2018/04/11/linux-custom-script-docker-sandbox/">our last article</a>.  They spin a VM with Docker installed and ready to use for dev purposes with least parameters.  The template is <a href="https://github.com/vplauzon/containers/tree/master/DockerVM">available on GitHub</a> (with the Click to deploy button).

We can also install Docker on a laptop.  We prefer not to clutter laptops with too many dev tools.  Hence we recommend the VM route.

It is important to note that Docker won't work on Ubuntu for Windows.  It <a href="https://docs.docker.com/docker-for-windows/install/">can be installed on Windows though</a>.
<h2>Docker Tutorial</h2>
For a first tutorial we recommend reading the <a href="https://docs.docker.com/get-started/">Getting started in 6 steps</a> from the Docker’s site.  Only the first two steps are mandatory reading.  Starting from step 3 are elements unique to Docker’s orchestrator, i.e. <a href="http://searchitoperations.techtarget.com/definition/Docker-Swarm">Docker Swarm</a>.  Docker Swarm is a container orchestrator.  In future article, we’ll look at Kubernetes (<a href="https://vincentlauzon.com/2018/04/04/overview-of-docker-containers-in-azure/#aks">as we discussed in our overview with AKS</a>).  Kubernetes is a more feature complete container orchestrator tool than Docker Swarm.  It is also more widely adopted.

Here we’re going to follow the tutorial.
<h2>Docker Image</h2>
<a href="https://docs.docker.com/get-started/part2/">Part two</a> (second step) is the crucial one.  It invites us to author our first container.  It is a simple enough web app built on the Python Flask Framework.

We start by <a href="https://docs.docker.com/get-started/part2/#define-a-container-with-dockerfile">authoring a Docker File</a>.  Then <a href="https://docs.docker.com/get-started/part2/#the-app-itself">we add artefact for the application</a>.  We then <a href="https://docs.docker.com/get-started/part2/#build-the-app">build a Docker image from that Docker File</a>.

Let’s pause here.

In our VM, let’s execute the following command:

[code language="bash"]

sudo docker image ls

[/code]

We should get at least the following images:

[code language="bash"]

REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
friendlyhello       latest              fd88801c252a        2 minutes ago       150MB
python              2.7-slim            b16fde09c92c        10 days ago         139MB

[/code]

<em>friendlyhello</em> is the image we just built in the tutorial.

The first line in the Docker File we authored, i.e. <em>FROM python:2.7-slim</em>, states the image is based on the <em>python:2.7-slim</em> image.  Docker transparently downloaded that image from the <a href="https://hub.docker.com/">public Docker Hub</a>.

We can go on the Docker Hub and find the <a href="https://hub.docker.com/_/python/">Python repository</a>.  If we look for the <em>2.7-slim</em> tag , we can click through and <a href="https://github.com/docker-library/python/blob/fb58b39c5ac1cfd5c901fde02b0bf08f8a6b4990/2.7/jessie/slim/Dockerfile">find its Docker File on GitHub</a>.  We can see it is based on the <em>debian:jessie-slim</em> image.

This illustrates the hierarchical nature of Docker images.
<h2>Running the App</h2>
Following the tutorial, we can now <a href="https://docs.docker.com/get-started/part2/#run-the-app">run the app</a>.

The container we defined in previous section exposes port 80.  We need to make sure the mapped port is open in Azure.  If we are using <a href="https://github.com/vplauzon/containers/tree/master/DockerVM">the VM we built in our last article</a>, we did open port 22 (SSH) but also 80 to 89.  So if we execute the following command:

[code language="bash"]

sudo docker run -d -p 81:80 friendlyhello

[/code]

This maps the port 80 inside the container to the port 81 on the VM.  The –<em>d</em> parameter also let the container run in the background.  We can therefore do the following command in the VM:

[code language="bash"]

curl http://localhost:81

[/code]

We should see something like:

[code language="bash"]






&lt;h3&gt;Hello World!&lt;/h3&gt;





&lt;b&gt;Hostname:&lt;/b&gt; effb80f5a3d2
&lt;b&gt;Visits:&lt;/b&gt; &lt;i&gt;cannot connect to Redis, counter disabled&lt;/i&gt;

[/code]

The request takes a few seconds because of the redis error.  This is on purpose as Redis is connected in a later part of the tutorial…

As shown in the tutorial, we can list the running containers and stop the one we created to run in the background.  But let’s keep the container running for now.
<h2>Look inside the Container</h2>
We know the theory.  Docker creates a user space in order to isolate the container runtime from the rest of the VM.  Part of this is the file system virtualization where the container doesn’t see the entire VM file system.

We can explore that by looking at what the container sees.  For that, let’s first find the container ID by listing all running containers:

[code language="bash"]

sudo docker container ls --filter &quot;ancestor=friendlyhello&quot;

[/code]

This should only list running containers using the <em>friendlyhello</em> image.  In our case:

[code language="bash"]

CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS                NAMES
effb80f5a3d2        friendlyhello       &quot;python app.py&quot;     6 hours ago         Up 6 hours          0.0.0.0:81-&amp;gt;80/tcp   compassionate_shtern

[/code]

So we found the ID is <em>effb80f5a3d2</em>.  We can now execute an interactive shell within that container:

[code language="bash"]

sudo docker exec -it effb80f5a3d2 sh

[/code]

We now have an interactive shell within the context of the container.

If we type <em>pwd</em>, we’ll find out we are in <em>/app</em>.  That is conform to the Dockerfile working directory command.

If we type <em>ls /</em>, we’ll see the container has access to the OS libraries (e.g. <em>/lib</em>, <em>/dev</em>, etc.).  If we explore further we’ll see the container’s view on those is limited.

Let’s go back to /app and execute the following command:

[code language="bash"]

echo &quot;New file within a running container&quot; &gt; abc.123

[/code]

Now let’s exit the shell to go back to the VM.  Let’s find the file within the VM:

[code language="bash"]

sudo find -iname &quot;abc.123&quot;

[/code]

This should yield result similar to:

[code language="bash"]

./var/lib/docker/overlay2/2ea5eb77ab5cdcae9a61aed73a809d6784b04bb6ab141993140293382b427ec5/merged/app/abc.123
./var/lib/docker/overlay2/2ea5eb77ab5cdcae9a61aed73a809d6784b04bb6ab141993140293382b427ec5/diff/app/abc.123

[/code]

If we look at the content of those files (e.g. <em>sudo cat</em>), we’ll find the content of the file we just created.

It is interesting to see a container at work.  Although the image is read only, a container could be written into.  Those files are ephemeral but they live on the host VM.
<h2>Image Publishing</h2>
The rest of the step 2 tutorial goes on publishing the image we built into Docker Hub.

We’ll see in a future article how to do that with <a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-intro">Azure Container Registry</a>.  As we have seen in our <a href="https://vincentlauzon.wordpress.com/?p=4610&amp;preview=true">overview</a>, Azure Container Registry is a private Docker Registry.  It is a fully managed service in Azure.
<h2>Summary</h2>
We parallel Docker’s good tutorial on containers.

Running that in Azure isn’t much different than running it elsewhere.  It is faster and more isolated.

In future article we’ll look at how to use other Azure services to run containers.