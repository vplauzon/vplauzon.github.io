---
title:  Get Started with Kubernetes (AKS) in Azure
date:  2018-05-08 10:30:25 +00:00
permalink:  "/2018/05/08/get-started-with-kubernetes-aks-in-azure/"
categories:
- Solution
tags:
- Containers
---
<a href="http://vincentlauzon.files.wordpress.com/2018/04/disney-concert-hall-1147810_640.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="disney-concert-hall-1147810_640" src="http://vincentlauzon.files.wordpress.com/2018/04/disney-concert-hall-1147810_640_thumb.jpg" alt="disney-concert-hall-1147810_640" width="320" height="137" align="right" border="0" /></a>A few weeks ago we wrote an article about how to <a href="http://vincentlauzon.com/2018/04/24/getting-started-with-docker-in-azure/">get started with Docker in Azure</a>.

This time we’ll do it with Kubernetes using <a href="https://docs.microsoft.com/en-us/azure/aks/intro-kubernetes">Azure AKS Service</a>.
<h2>What is Kubernetes?</h2>
From <a title="https://kubernetes.io/" href="https://kubernetes.io/">https://kubernetes.io/</a>:

<em>Kubernetes is an open-source system for automating deployment, scaling, and management of containerized applications.</em>

In the <a href="https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/">online documentation overview</a>, Kubernetes is further defined as:
<ul>
 	<li>a container platform</li>
 	<li>a micro-services platform</li>
 	<li>a portable cloud platform</li>
</ul>
Kubernetes was inspired by <a href="https://www.quora.com/What-is-Borg-at-Google">Google’s Borg project</a>.  Google uses Borg to <a href="https://research.google.com/pubs/pub43438.html">run very large clusters</a> (10 000 machines).

There are a lot of Kubernetes tutorials.  We suggest two here:
<ol>
 	<li><a href="https://kubernetes.io/docs/tutorials/kubernetes-basics/cluster-interactive/">Kubernetes Interactive Tutorial</a>:  online tutorial giving access to a Kubernetes cluster via a web interface.  Zero install required.  Learn from the source (i.e. <a title="https://kubernetes.io/" href="https://kubernetes.io/">https://kubernetes.io/</a>)</li>
 	<li><a href="https://courses.edx.org/courses/course-v1:LinuxFoundationX+LFS158x+1T2018/course/">Introduction to Kubernetes from Linux Foundation X (LFS158x) by EDX</a>:  like many EDX courses, it is free unless we want a certificate.  It covers Kubernetes at large.  It is text-based (i.e. not much videos).</li>
</ol>
We suggest getting our hands dirty using Azure AKS right away as opposed to installing Minikube on our laptop.
<h2>What is Azure AKS?</h2>
<img style="float:left;display:inline;" src="https://vincentlauzon.files.wordpress.com/2018/03/containerservice.png" width="200" height="96" align="left" />

AKS is a managed service running Kubernetes Clusters (as we’ve seen in our <a href="https://vincentlauzon.com/2018/04/04/overview-of-docker-containers-in-azure/">Overview of containers in Azure</a>).

It is managed in the sense the service manages (e.g. patches) the worker nodes VMs.  Head nodes aren’t charged.

AKS is the next generation of ACS.  ACS was an unmanaged service where both head and worker VMs were the responsibility of the user.
<h2>Using AKS</h2>
AKS has a very low friction <a href="https://docs.microsoft.com/en-us/azure/aks/kubernetes-walkthrough">starting scenario using the Azure CLI</a>.  A similar scenario exists using the <a href="https://docs.microsoft.com/en-us/azure/aks/kubernetes-walkthrough">Azure Portal</a>.  We recommend trying the CLI one as the Portal’s support is still limited (as of this writing, mid-April 2018).

The creation of a cluster is one simple command:

[code language="bash"]

az aks create --resource-group myResourceGroup --name myAKSCluster --node-count 1 --generate-ssh-keys

az aks install-cli

az aks get-credentials --resource-group myResourceGroup --name myAKSCluster

[/code]

The first command creates the cluster (in a pre-existing resource group).  The second installs Kubernetes CLI.  The third one downloads the cluster’s credentials for Kubernetes CLI to use.

That’s it.

The <a href="https://docs.microsoft.com/en-us/azure/aks/kubernetes-walkthrough">online documentation</a> goes through those steps and more.  We create two deployments and two services and test them.

It is quite easy and convenient to do this demo on our laptop.  Same thing for any training (e.g. those suggested in the previous section) .  It requires a Linux environment.  We use <a href="https://docs.microsoft.com/en-us/windows/wsl/install-win10">Windows Subsystem for Linux</a> (aka bash shell).  If for some reason that isn’t possible, we can always <a href="https://vincentlauzon.com/2018/04/11/linux-custom-script-docker-sandbox/">provision a VM in Azure with Azure CLI</a>.

Only the Kubernetes CLI gets installed on the client machine.  Kubernetes itself and all running containers are in AKS.  The client machine doesn’t get contaminated.
<h2>Doing more</h2>
The online documentation is quite good at this point (mid-April 2018).  We can learn many of the basics of AKS:
<ul>
 	<li>Using <a href="https://docs.microsoft.com/en-us/azure/aks/kubernetes-dashboard">Kubernetes Dashboard</a></li>
 	<li><a href="https://docs.microsoft.com/en-us/azure/aks/aks-ssh">SSH to nodes</a></li>
 	<li><a href="https://docs.microsoft.com/en-us/azure/aks/scale-cluster">Scaling</a> (i.e. increase / decrease the number of nodes) a cluster with the CLI</li>
 	<li><a href="https://docs.microsoft.com/en-us/azure/aks/upgrade-cluster">Upgrading</a> (i.e. upgrade to a newer version of Kubernetes) the cluster with no downtime.  This is meant for production use.  It therefore prioritizes availability over speed.  One CLI command orchestrates the upgrade of an entire cluster.  This shows the advantage of managed services.</li>
 	<li>Configuring Kubernetes volumes using <a href="https://docs.microsoft.com/en-us/azure/aks/azure-disk-volume">Azure Disks</a> &amp; <a href="https://docs.microsoft.com/en-us/azure/aks/azure-files-volume">Files</a>.  We can also use Kubernetes <a href="https://docs.microsoft.com/en-us/azure/aks/azure-disks-dynamic-pv">Persistent volumes</a> for better separation of dev &amp; ops.</li>
 	<li><a href="https://docs.microsoft.com/en-us/azure/aks/ingress">Configuring Network Ingress</a></li>
 	<li><a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-auth-aks?toc=%2fazure%2faks%2ftoc.json">Integrating</a> with <a href="https://vincentlauzon.com/2018/05/01/azure-container-registry-getting-started/">Azure Container Registry</a></li>
 	<li>Using <a href="https://docs.microsoft.com/en-us/azure/aks/kubernetes-helm">Helm</a></li>
 	<li>Using <a href="https://docs.microsoft.com/en-us/azure/aks/kubernetes-draft">Draft</a></li>
 	<li>Using <a href="https://docs.microsoft.com/en-us/azure/aks/integrate-azure">Open Service Broker for Azure</a> (OSBA) to integrate Azure PaaS services (e.g. Azure SQL) into Kubernetes deployment</li>
 	<li>Using <a href="https://docs.microsoft.com/en-us/azure/aks/jenkins-continuous-deployment">Jenkins</a> for Continuous deployment</li>
 	<li>Using <a href="https://docs.microsoft.com/en-us/azure/aks/openfaas">OpenFaaS</a> (a Function as a Service Open Source framework)</li>
 	<li><a href="https://docs.microsoft.com/en-us/azure/aks/spark-job">Running Spark jobs</a> on AKS</li>
 	<li>Using <a href="https://docs.microsoft.com/en-us/azure/aks/gpu-cluster">GPUs</a></li>
</ul>
Finally the <a href="https://docs.microsoft.com/en-us/azure/aks/faq">FAQ</a> is a good place to go about incoming features and current limitations.
<h2>Summary</h2>
Azure AKS is a strong addition to the Container family in Azure.  It is growing quite quickly although it isn’t Generally Available (GA) as of this writing (mid April 2018) yet.

The friction free setup and general management of the cluster makes it very quick &amp; easy to start.

Given the popularity of Kubernetes, this service is a must to get familiar with.