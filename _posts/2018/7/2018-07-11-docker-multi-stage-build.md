---
title: Docker multi-stage build
date: 2018-07-11 06:30:47 -04:00
permalink: /2018/07/11/docker-multi-stage-build/
categories:
- Solution
tags:
- Containers
---
<a href="/assets/2018/7/docker-multi-stage-build/dark-flight-launch-73872.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="dark-flight-launch-73872" src="/assets/2018/7/docker-multi-stage-build/dark-flight-launch-73872_thumb.jpg" alt="dark-flight-launch-73872" width="320" height="213" align="right" border="0" /></a>I recently came across a really nice feature of Docker Build and wanted to share it.

Building a Docker Image often requires to build binaries.  In my case I needed to build a .NET core application.  You might need to build a Java App or any other types of apps.

I was using my <a href="https://vincentlauzon.com/2018/04/11/linux-custom-script-docker-sandbox/">Docker sandbox VM</a> to perform Docker builds.  I really like that VM image since each time I create a new one I get a fresh image.  It doesn’t have .NET core SDK on it though.  I could install it but it broke the experience a little.

I thought about setting up my <a href="https://visualstudio.microsoft.com/team-services/continuous-integration/">Continuous Integration</a> service.  I was wondering…  what is better to setup an isolated environment than a container?  Then discovered multi-stage build.  Special thanks to my colleague <a href="https://blog.maximerouiller.com/">Maxime Rouiller</a> for that discovery!

Multi-stage allows us to build many images and exchange files between them.  We can perform compilation in an image and use the output in another.  We can do that multiple times, in multiple stages.

Let me share the details with you!
<h2>Background</h2>
First for a little background, see our article on <a href="https://vincentlauzon.com/2018/04/04/overview-of-docker-containers-in-azure/">Overview of Containers in Azure</a>.

We also have a <a href="https://vincentlauzon.com/2018/04/24/getting-started-with-docker-in-azure/">Getting started with Containers in Azure</a>.

We wrote <a href="https://vincentlauzon.com/tag/containers/">many more articles on containers</a>.
<h2>Multi-Stage builds</h2>
Docker has a nice <a href="https://docs.docker.com/develop/develop-images/multistage-build/">article around multi-stage builds</a>.  We won’t repeat the content here.  Instead, we’ll give an example with our recent <a href="https://vincentlauzon.com/2018/06/20/cosmos-db-configuration-management/">Cosmos DB Configuration Management tool</a>.  The tool is deployed as a <a href="https://hub.docker.com/r/vplauzon/cosmos-db-target-config/">Docker Image available on Docker Hub</a>.

The Docker file, <a href="https://github.com/vplauzon/cosmos-db-target-config/blob/master/CosmosTargetConsole/Dockerfile">available on GitHub</a> is reproduced here:

[code language="shell"]

#    Multi-stage docker build file (see &lt;a href=&quot;https://docs.docker.com/develop/develop-images/multistage-build/)&quot;&gt;https://docs.docker.com/develop/develop-images/multistage-build/)&lt;/a&gt;
#    Use a Microsoft image with .NET core runtime (&lt;a href=&quot;https://hub.docker.com/r/microsoft/dotnet/tags/)&quot;&gt;https://hub.docker.com/r/microsoft/dotnet/tags/)&lt;/a&gt;
FROM microsoft/dotnet:2.1-sdk AS build

WORKDIR /src

#    Copy source code into the source folder
COPY . .

#    Publish the app into the app folder
RUN dotnet publish . -c release -o app

###########################################################
#    Final container image
#    Use a Microsoft image with .NET core runtime (&lt;a href=&quot;https://hub.docker.com/r/microsoft/dotnet/tags/)&quot;&gt;https://hub.docker.com/r/microsoft/dotnet/tags/)&lt;/a&gt;
FROM microsoft/dotnet:2.1-runtime AS final

#    Set the working directory to /work
WORKDIR /work

#    Copy package
COPY --from=build /src/app .

#    Define environment variables
ENV ACCOUNT_ENDPOINT &quot;&quot;
ENV ACCOUNT_KEY &quot;&quot;
ENV TARGET_URL &quot;&quot;

#    Run console app
CMD [&quot;dotnet&quot;, &quot;CosmosTargetConsole.dll&quot;]

[/code]

Let’s review that Docker File.

At <strong>line 3</strong>, we declare an image build from <em>microsoft/dotnet:2.1-sdk</em>.  That Docker image contains .NET core SDK.  It isn’t optimal for a runtime image which is what we need in the end.  It is required to build .NET core applications though.

We give the image a name by using <em>AS build</em>.  We will refer to that image in the next stage.

We then copy files from the host environment (the VM).  Those files are the GitHub source files.

In <strong>line 11</strong>, we build (with the publish command) our application.

In <strong>line 16</strong>, we declare another image.  That image is based on the leaner <em>microsoft/dotnet:2.1-runtime</em> image.  That image doesn’t contain the SDK.

In <strong>line 22</strong>, we copy the build output from the <em>build</em> image.

After that we simply declare environment variables and define the entry point command.
<h2>Advantages of multi-stage builds</h2>
The advantages of multi-stage builds are:
<ul>
 	<li>Have a consistent build environment to build an application</li>
 	<li>No compromise on the Docker Image we are building.  Do not include SDKs and other build-artefacts.</li>
</ul>
<h2>Summary</h2>
I hope this feature will prove as useful as it did for us.

It is quite easy to use and streamlined a lot of operations for us.