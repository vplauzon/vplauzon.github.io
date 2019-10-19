---
title:  Understanding identities in Azure AKS / Kubernetes
date:  2018-05-10 06:30:27 -04:00
permalink:  "/2018/05/10/understanding-identities-in-azure-aks-kubernetes/"
categories:
- Solution
tags:
- Containers
- Identity
- Security
---
<a href="http://vincentlauzon.files.wordpress.com/2018/04/face-3189811_640.jpg"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="From Pixabay" src="http://vincentlauzon.files.wordpress.com/2018/04/face-3189811_640_thumb.jpg" alt="https://pixabay.com/en/face-faces-dialogue-talk-psyche-3189811/" width="320" height="213" align="left" border="0" /></a><a href="https://vincentlauzon.com/2018/05/08/get-started-with-kubernetes-aks-in-azure/">We’ve recently looked at Azure AKS</a> (Kubernetes Cluster Managed Services).  We’ve looked at how to create a Kubernetes Cluster with 3 lines of Azure CLI.

With this we are able to interact with the cluster &amp; deploy containers.

There is a bit of “auto magic” happening in there.  In this article we will focus on that magic.  Specifically, we’ll focus on identity.

The first bit of magic is <u>how do we connect to the cluster</u>?  At no point have we logged in on the cluster.  When we interact with the cluster, we use <em>kubectl</em>.  That is a Kubernetes tool, not an Azure tool.  Can that tool use our Azure AD credentials?

The second bit of magic might not be obvious on first trial.  Let’s consider using Kubernetes for tasks such as:
<ul>
 	<li><a href="https://docs.microsoft.com/en-us/azure/aks/kubernetes-walkthrough#test-the-application">Creating Kubernetes services with public IPs</a></li>
 	<li><a href="https://docs.microsoft.com/en-us/azure/aks/azure-disks-dynamic-pv">Creating Azure disks via Kubernetes Persistent Volumes</a></li>
</ul>
Those tasks do create Azure resources:  they create Public IPs and Azure Disks.

A question we could ask is “<u>who is creating those resources</u>”?  Which Azure AD user is creating the Azure resources?  Is it our own personal account?  We’re the one behind the keyboard and we’re logged into Azure CLI.  But this isn’t Azure CLI, it’s the Kubernetes AKS Cluster, from within Azure.

Let’s unpack that magic.
<h2>Identity Future</h2>
A caveat from the get go, Azure RBAC integration is <a href="https://docs.microsoft.com/en-us/azure/aks/faq#does-aks-support-kubernetes-role-based-access-control-rbac">coming to AKS</a>.  <a href="http://blog.jreypo.io/">Juan Manuel Rey</a> give a sneak peak of how it might look <a href="http://blog.jreypo.io/containers/microsoft/azure/cloud/cloud-native/kubernetes-18-with-rbac-enabled-and-azure-active-directory-integration/">here</a>.

As of this writing (end of April 2018), it isn’t implemented.
<h2>Workflow with identities</h2>
Here are the three CLI lines to create and connect to an AKS Kubernetes Cluster:

(code)

az aks create --resource-group myResourceGroup --name myAKSCluster --node-count 1 --generate-ssh-keys

az aks install-cli

az aks get-credentials --resource-group myResourceGroup --name myAKSCluster

(code)

The first line creates the cluster.  The second installs <em>kubectl </em>(Kubernetes client controller).  The third one configures <em>kubectl</em> to connect to the cluster.

Only step 1 &amp; step 3 involves identity.  Step 2 litterally is only an install of kubectl tool.

Let’s add the following steps:
<ol start="4">
 	<li>Creating a replica set (through a Kubernetes deployment)</li>
 	<li>Creating an Azure Disk via Persistant Volume Claim</li>
</ol>
Step #4 deals with the cluster only.  Step #5 creates objects on the cluster.  But it also integrates with Azure to create an Azure Disk and attaching it to a VM in the cluster.

So let’s look at the entire workflow focussing on the identity.
<h3>Step 1 – az aks create</h3>
<a href="http://vincentlauzon.files.wordpress.com/2018/04/step1.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="Step1" src="http://vincentlauzon.files.wordpress.com/2018/04/step1_thumb.png" alt="Step1" border="0" /></a>

Let’s walk through the sub steps, focussing on how identities are handled:
<ol style="list-style-type:lower-alpha;">
 	<li>End-user launch the Azure CLI command “<em>az aks create…</em>”</li>
 	<li>The Azure CLI uses cached user’s token (i.e. Azure AD user account) to do an Azure REST API call to create the AKS service</li>
 	<li>Azure Resource Manager provisions an AKS Service.  That service will orchestrate different sub resources creation.</li>
 	<li>AKS creates a Service Principal in the same Azure AD tenant as the user</li>
 	<li>AKS provisions a set of worker nodes VMs and install Kubernetes on them</li>
 	<li>When Kubernetes is created (on the master nodes not shown on this diagram), it creates a cluster admin.  That cluster admin is a Kubernetes user and doesn’t belong to Azure AD.</li>
 	<li>Service Principal credentials are copied on master and worker nodes at /etc/kubernetes/azure.json</li>
 	<li>REST API returns the Service Principal credentials.  They are written locally on ~/.azure/aksServicePrincipal.json.  That file gets overwritten every time, i.e. it doesn’t accumulate credentials.</li>
</ol>
Already, on the first step, on this innocuous CLI command, we see three identities:
<ol>
 	<li>The Azure AD User identity:  this is the user running Azure REST API commands.  In automation context, that could also be a service principal.</li>
 	<li>A Service principal:  this identity will later interact with Azure (e.g. creating Azure disks) on behalf of the cluster</li>
 	<li>The Kubernetes admin user:  a non-Azure AD user.  This is the identity that will later run kubectl commands.</li>
</ol>
An important point here.  The Azure AD user must have the right to create service principals.  If not, creation will fail.
<h3>Step 2 – az aks install-cli</h3>
To our knowledge, nothing happens at the identity level with that command.  It installs a version of kubectl CLI compatible with Azure.
<h3>Step 3 - az aks get-credentials</h3>
<a href="http://vincentlauzon.files.wordpress.com/2018/04/step3.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="Step3" src="http://vincentlauzon.files.wordpress.com/2018/04/step3_thumb.png" alt="Step3" border="0" /></a>

Here are the sub steps:
<ol style="list-style-type:lower-alpha;"><!--StartFragment-->
 	<li>End-user launch the Azure CLI command “<em>az get credentials…</em>”</li>
 	<li>The Azure CLI uses cached user’s token (i.e. Azure AD user account) to do an
Azure REST API call to get credentials from the AKS service</li>
 	<li>Azure Resource Manager queries AKS Service to get the Kubernetes Admin credentials</li>
 	<li>The REST API returns the Kubernetes Admin credentials.  They are written
locally (e.g. on end user laptop).  Path is ~/.kube/config.</li>
</ol>
Subsequent command will then be able to simply lookup the ~/.kube/config file to authenticate against the cluster.  That YAML file accumulates information about different clusters and keeps track of the “current” one.  Here is an example with 2 clusters:

<a href="http://vincentlauzon.files.wordpress.com/2018/04/image4.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="http://vincentlauzon.files.wordpress.com/2018/04/image_thumb4.png" alt="image" border="0" /></a>
<h3>Step 4 – Create replicate set</h3>
Let’s assume we deploy some containers on a replica set without creating Azure resources.  This step illustrate the typical interaction with Kubernetes cluster.  It could be a simple read operations (e.g. <em>kubectl get pods</em>).

<a href="http://vincentlauzon.files.wordpress.com/2018/04/image5.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="http://vincentlauzon.files.wordpress.com/2018/04/image_thumb5.png" alt="image" border="0" /></a>

Sub steps:
<ol style="list-style-type:lower-alpha;">
 	<li>End-user launch the kubectl CLI command “<em>kubectl create…</em>”</li>
 	<li>kubectl CLI uses cached credentials to do a Kubernetes API call</li>
 	<li>AKS service relays the call to the underlying cluster</li>
</ol>
We see kubectl commands use credentials gathered in previous step.
<h3>Step 5 – Creating Azure Disks</h3>
Let’s assume we do another deployment with <em>kubectl create</em>.  This time, one of the underlying pod will provision an Azure disk.

This shows how Kubernetes integrates back to Azure.

<a href="http://vincentlauzon.files.wordpress.com/2018/04/image6.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="http://vincentlauzon.files.wordpress.com/2018/04/image_thumb6.png" alt="image" border="0" /></a>

Sub steps:
<ol style="list-style-type:lower-alpha;">
 	<li>End-user launch the kubectl CLI command “<em>kubectl create…</em>”</li>
 	<li>kubectl CLI uses cached credentials to do a Kubernetes API call</li>
 	<li>AKS service relays the call to the underlying cluster</li>
 	<li>Kubernetes calls Azure Resource Manager to provision an Azure Disk.  It uses Service Principal credentials.</li>
</ol>
<h2>Alternatives</h2>
We unveiled the magic behind the scenes.

That path is the quickest to get value out of Azure AKS but in production scenarios, we might want more control.

For instance, we might want to create the Azure AD Service Principal beforehand.  The <a href="https://docs.microsoft.com/en-us/azure/aks/kubernetes-service-principal">procedure to do that is well explained in online documentation</a>.

There might be different reasons to do that:
<ul>
 	<li>Nomenclature / standard:  we might want to control the name of the service principal</li>
 	<li>Rights:  maybe a user doesn’t have rights to create service principals</li>
 	<li>Reuse service principal</li>
</ul>
<h2>Summary</h2>
We did drill down in the different identities involved in different AKS scenarios.

That knowledge isn’t required to start using AKS.  It does become useful when considering operationalizing the service though.
<ol style="list-style-type:lower-alpha;"><!--EndFragment--></ol>