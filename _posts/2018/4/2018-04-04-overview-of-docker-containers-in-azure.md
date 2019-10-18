---
title:  Overview of Docker Containers in Azure
date:  04/04/2018 10:30:24
permalink:  "/2018/04/04/overview-of-docker-containers-in-azure/"
categories:
- Solution
tags:
- Containers
---
<a href="assets/2018/4/overview-of-docker-containers-in-azure/business-cargo-cargo-container-262353.jpg"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="business-cargo-cargo-container-262353" src="assets/2018/4/overview-of-docker-containers-in-azure/business-cargo-cargo-container-262353_thumb.jpg" alt="business-cargo-cargo-container-262353" width="320" height="213" align="left" border="0" /></a>

Let’s talk about Containers in Azure.

In this article, we’ll cover services related to Containers in Azure.  We’ll see what scenarios they each address.

Azure focuses on <a href="https://www.docker.com/">Docker</a> for container.  There are other <a href="https://en.wikipedia.org/wiki/Operating-system-level_virtualization#Implementations">container technologies</a> out there.  But Docker is by far the most popular.

Our map will be the <a href="https://docs.microsoft.com/en-ca/azure/#pivot=products&amp;panel=containers">current services</a> as of this writing (early April 2018):

<a href="assets/2018/4/overview-of-docker-containers-in-azure/image7.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/4/overview-of-docker-containers-in-azure/image_thumb7.png" alt="image" border="0" /></a>

It is important to note that this space moves quite fast and that picture will change.
<h2>What are containers?</h2>
<a href="assets/2018/4/overview-of-docker-containers-in-azure/box-close-up-gift-842876.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="box-close-up-gift-842876" src="assets/2018/4/overview-of-docker-containers-in-azure/box-close-up-gift-842876_thumb.jpg" alt="box-close-up-gift-842876" width="320" height="228" align="right" border="0" /></a>Before jumping into managed services, let’s give a <strong><u>super brief</u> </strong>overview of containers.  <a href="https://docs.docker.com/get-started/#docker-concepts">A good overview of containers is available on Docker’s site</a>.

In a nutshell, Docker Containers offer a way to:
<ul>
 	<li>Package environments / applications (Docker File / Image)</li>
 	<li>Share those packages (Docker Registry)</li>
 	<li>Run containers in isolation (<a href="https://en.wikipedia.org/wiki/Operating-system-level_virtualization">OS level isolation</a>)</li>
</ul>
Docker isn’t anything new under the sun.  Application Packaging is old news and OS level isolation is common place on Linux.  But it brings an Open Source standard.  That means a proliferation of Open Source tools.

Docker Containers also hit a sweet spot in terms of architecture compromises.  Let’s compare them to Virtual Machines.  Docker Containers do not offer as much isolation &amp; security.  But they offer agility:  lighter image size, shorter deployment time &amp; quicker startup.  Let’s compare them to direct install (e.g. deploying a web app on a server).  Docker is an heavier weight alternative.  But it offers more isolation, security &amp; repeatability.  The last point means it get us out of the <em>it works on my laptop</em> syndrome.

For those reasons, Docker Containers are quite popular in the Cloud &amp; Dev-Ops world.  They are portable, relatively easy to author, quick to deploy &amp; lightweight in general.
<h2>Virtual Machines</h2>
<a href="assets/2018/4/overview-of-docker-containers-in-azure/image10.png"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="image" src="assets/2018/4/overview-of-docker-containers-in-azure/image_thumb10.png" alt="image" width="65" height="60" align="left" border="0" /></a>We discuss <em>managed services</em> in this article.  Still it is possible to run everything on Virtual Machines (VMs) to get more control.

The onus of managing VMs then fall on us.  This increases the Total Cost of Ownership (TCO).  But it allows us to have a better control on the running software, which can be useful in some situation.
<h2 id="aks">AKS (ACS?)</h2>
<a href="assets/2018/4/overview-of-docker-containers-in-azure/containerservice.png"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="ContainerService" src="assets/2018/4/overview-of-docker-containers-in-azure/containerservice_thumb.png" alt="ContainerService" width="160" height="78" align="right" border="0" /></a><a href="https://docs.microsoft.com/en-us/azure/aks/intro-kubernetes">Azure Container Services</a> (AKS) is a managed Kubernetes Cluster.

By <em>managed</em> we mean the OS &amp; Kubernetes get patched &amp; upgraded automatically.  We do not manage underlying worker nodes (i.e. VMs).  Also, master nodes are fully managed and aren’t billed.

What is Kubernetes and what is its relationship with Docker Containers?  When running multiple containers on a cluster, we quickly need more tools than the Docker tool.  We need something to:
<ul>
 	<li>Schedule containers</li>
 	<li>Monitor their health</li>
 	<li>Restart them</li>
 	<li>Perform roll-over updates</li>
 	<li>Etc.</li>
</ul>
Those features are associated with a container orchestration / middleware, for instance Kubernetes.

Kubernetes quickly is emerging as a lead runner of the Container Orchestrator race.  Pioneered by Google, it is now open sourced with a strong community.

AKS is still in preview at the time of this writing (early April 2018).  Despite that, it is the go-to service for managed Kubernetes.

There is some confusion around AKS and ACS.  AKS replaces ACS.  ACS supported Kubernetes but also Mesos &amp; Docker Swarm.  It wasn’t fully managed though.  It was more of an accelerator to create a cluster of VMs (including the master nodes).  VMs would need to be managed by us subsequently.

AKS is easy to setup and sports a fully open-source version of Kubernetes.

AKS is perfect to run containers either for dev-test or production.
<h2>Azure Container Instance</h2>
<a href="assets/2018/4/overview-of-docker-containers-in-azure/image9.png"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="image" src="assets/2018/4/overview-of-docker-containers-in-azure/image_thumb9.png" alt="image" width="160" height="160" align="right" border="0" /></a><a href="https://docs.microsoft.com/en-us/azure/container-instances/container-instances-overview">Azure Container Instance</a> (ACI) is a new form of compute pioneered by Azure.

It consists of a VM-less container.  Instead of provisioning a VM (or a cluster) to run containers, ACI allows us to run a container by itself.

The <a href="https://azure.microsoft.com/en-ca/pricing/details/container-instances/">pricing model</a> is core / RAM per minute.

This makes ACI ideal for bursting scenarios when a cluster doesn’t have enough capacity.  It is also well suited to run “batch jobs”, i.e. jobs running sporadically.

A typical architecture has an AKS cluster running “long running” containers.  ACI can then be used for bursting and jobs.  This way, ACI run containers do not impact cluster resources.

ACI is also perfect to run container in isolation, e.g. during a dev phase.
<h2>Azure Container Registry</h2>
<p align="left"><a href="assets/2018/4/overview-of-docker-containers-in-azure/image11.png"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="image" src="assets/2018/4/overview-of-docker-containers-in-azure/image_thumb11.png" alt="image" width="57" height="49" align="left" border="0" /></a><a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-intro">Azure Container Registry</a> offers a managed Docker Registry.  This enables us to publish Docker images to our own private registry.</p>
<p align="left">The alternative is installing a Docker Registry server on a VM cluster or using the <a href="https://hub.docker.com/">Docker Hub</a>.  Azure Container Registry is fully managed, follows Azure numerous compliances and is integrated with Azure identity / security.</p>
Also, Azure Container Registry can be deployed in the same region as our workload.  This means less latency for publishing and consuming Docker Images.

Most Enterprise deployments use Azure Container Registry.
<h2>Service Fabric</h2>
<a href="assets/2018/4/overview-of-docker-containers-in-azure/image12.png"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="image" src="assets/2018/4/overview-of-docker-containers-in-azure/image_thumb12.png" alt="image" width="63" height="62" align="right" border="0" /></a><a href="https://docs.microsoft.com/en-us/azure/service-fabric/service-fabric-overview">Service Fabric</a> is Azure <a href="https://docs.microsoft.com/en-us/azure/service-fabric/service-fabric-overview-microservices">Micro-Services</a> platform.

Service Fabric is running a ton of services in Azure.  For instance, Azure SQL DB, Cosmos DB &amp; Intune are all running on top of Service Fabric.

Microsoft built Service Fabric to serve internal services before <a href="https://en.wikipedia.org/wiki/Docker_(software)#History">Docker Containers were public</a>.  It was released as an Azure Service later.  It is now freely available for Windows and Linux servers.  In that sense, it isn’t bound to Azure.

Service Fabric now supports Docker Containers.  It is comparable to Kubernetes.  It also supports stateful services.  Stateful service have their state persisted locally and replicated on different nodes.

Service Fabric really shines in Micro-Services scenarios.
<h2>Web App</h2>
<a href="assets/2018/4/overview-of-docker-containers-in-azure/image13.png"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="image" src="assets/2018/4/overview-of-docker-containers-in-azure/image_thumb13.png" alt="image" width="64" height="62" align="left" border="0" /></a>At a high level Docker Containers are:  app packaging, sharing and running in isolation.  Containers have a lot of similarities with different Cloud Computing platforms.

For instance, traditional Azure Web App packages.  Application is packaged as a zip file.  It can then easily be deployed to any Web App.  Web App run in lock-down environments, ensuring isolation between different apps.

As we explained, Docker Containers offer a Open Source standard.

<a href="https://docs.microsoft.com/en-us/azure/app-service/containers/app-service-linux-intro">Azure Web App now supports Docker Containers</a>.  That bring the best of both world together.  Azure Web Apps become a sort of specialized Docker Container orchestrator.  We benefit from the platform knowing containers are Web Apps.  It can load balance them, auto scale them, manage certificates, etc.  .  Most great features Azure Web Apps have introduced over the years but for Containers.
<h2>Batch</h2>
<a href="assets/2018/4/overview-of-docker-containers-in-azure/image14.png"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="image" src="assets/2018/4/overview-of-docker-containers-in-azure/image_thumb14.png" alt="image" width="64" height="59" align="right" border="0" /></a>Similarly to Azure Web Apps, <a href="https://docs.microsoft.com/en-us/azure/batch/batch-technical-overview">Azure Batch</a> now supports Docker Containers.

Azure Batch is great for Big Compute.  It can schedule tasks with dependencies on a fully managed cluster.  It is a great platform to run CPU-intensive computation in a reliable way.

“Pre Containers Batch” managed zip-file packages with pre-install scripts.  Docker Containers allow to fully encapsulate a runtime environment in a standard way.
<h2>Summary</h2>
Azure has fully embraced Docker Containers technology.  Docker Containers can be leveraged in a variety of services as we’ve seen.

That technological space changes quickly and constantly.

Azure story isn’t fully written yet.

We could speculate on what different shape the strategy will take, but we won’t indulge in that here.  We did show that Docker Containers are becoming ubiquitous on the platform.  They will get a growing support and integration level.