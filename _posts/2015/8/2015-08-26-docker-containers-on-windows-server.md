---
title:  Docker Containers on Windows Server
date:  2015-08-26 19:00:36 -04:00
permalink:  "/2015/08/26/docker-containers-on-windows-server/"
categories:
- Solution
tags:
- API
- Containers
---
If you had any doubts about the increased pace in IT innovation, look at <a href="https://en.wikipedia.org/wiki/Docker_(software)" target="_blank">Docker Containers</a>.  The project was open sources in March 2013 as a container technology for Linux and 1.5 years later, in Octobre 2014, Microsoft announced they were integrating that technology on Windows Server 2016!

That's 1.5 years from toe in the water to major influence.  Impressive!

<a href="/assets/2015/8/docker-containers-on-windows-server/logo4.png"><img class="size-full wp-image-1190 alignleft" src="/assets/2015/8/docker-containers-on-windows-server/logo4.png" alt="logo[4]" width="291" height="70" /></a>

The first Windows Server Container Preview has been <a href="http://weblogs.asp.net/scottgu/announcing-windows-server-2016-containers-preview" target="_blank">announced in August 2015</a> as part of the Technical Preview 3 of Windows Server.  The preview also comes with Visual Studio integration, in the form of <a href="http://aka.ms/vslovesdocker" target="_blank">Visual Studio tools for Docker</a>.

Mark Russinovich also published a very good <a href="http://azure.microsoft.com/blog/2015/08/17/containers-docker-windows-and-trends/" target="_blank">technical post </a>about Docker containers on Windows:  what they are, what are the advantages &amp; scenarios where they nicely apply to.

Basically, Docker Containers are standard packages to deploy solution on a host.  The main advantage of having Docker Containers are in the small footprint of the container which results in a higher density of applications on a given host and a very quick startup time, compare to a Virtual Machine where the entire OS must be loaded in memory and booted.

In Windows, hosts will come in two flavours:  Windows Server host &amp; Hyper-V host.  The former will maximize resource utilization and container density on a host while the latter maximizes isolation.

At first the Hyper-V container sounds like it defies the purpose of having Docker Containers in the first place since they basically implement the container as an entire VM.  But if you think about it, on the long run it makes perfect sense.  The first version of Docker Container on Windows will likely have security holes in them.  Therefore if you have scenario with 'hostile multi-tenants', you'll probably want to stick to Hyper-V.  But in time, the security of Docker on Windows will tighten and you'll be able to move to normal containers as a configuration-change.

<a href="/assets/2015/8/docker-containers-on-windows-server/service-fabric.png"><img class="size-medium wp-image-1194 alignright" src="/assets/2015/8/docker-containers-on-windows-server/service-fabric.png?w=300" alt="Service Fabric" width="300" height="155" /></a>

We can imagine that once Windows Server 2016 roll out, we'll see Docker Container appearing in Azure.  I wouldn't be surprise to see them fuse with the <a href="https://azure.microsoft.com/en-us/services/app-service/?b=15.28" target="_blank">App Services</a> shortly after that.

They are also very likely to be part of the upcoming <a href="http://azure.microsoft.com/en-us/campaigns/service-fabric/" target="_blank">Azure Service Fabrik</a>, Microsoft offering for rapidely building Micro Services.