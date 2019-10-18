---
title:  Azure Container Instance - Getting Started
date:  2018-04-26 10:30:12 +00:00
permalink:  "/2018/04/26/azure-container-instance-getting-started/"
categories:
- Solution
tags:
- Containers
---
<a href="http://vincentlauzon.files.wordpress.com/2018/04/business-commerce-container-379964.jpg"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="business-commerce-container-379964" src="http://vincentlauzon.files.wordpress.com/2018/04/business-commerce-container-379964_thumb.jpg" alt="business-commerce-container-379964" width="320" height="213" align="left" border="0" /></a>We’ve looked at an overview of <a href="https://vincentlauzon.com/2018/04/04/overview-of-docker-containers-in-azure/">Docker Containers in Azure</a>.  One of the services we talked about is <a href="https://docs.microsoft.com/en-us/azure/container-instances/container-instances-overview">Azure Container Instance</a> (ACI).

ACI allows us to start a Docker Container without a cluster, without even a VM.

It is ideal for bursting, recurrent jobs and dev-test.

We are going to focus on ACI in this article.
<h2>Fundamentals of Azure Container Instance</h2>
In order to create an ACI, we need to point it to a Docker Image from a Docker Registry.  That could be the <a href="https://hub.docker.com">Docker Hub</a> or our own private <a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-intro">Azure Container Registry</a>.  It could also be any other registry accessible over the internet.

That’s the only mandatory aspect.  There are a bunch of options though:
<ul>
 	<li>We can associate a DNS label with the container.  That is a prefix to the standard &lt;prefix&gt;.&lt;region&gt;.azurecontainer.io.  For instance, myprefix.eastus.azurecontainer.io.  ACI will create a public IP with that name.
<ul>
 	<li>We can then map ports.  The internal container ports will be map to that public IP.</li>
</ul>
</li>
 	<li>The OS type can be either Linux or Windows.  Since Windows 2016, Windows also support containers.</li>
 	<li>We can customize environment variables.</li>
 	<li>We can mount an Azure File Share on the container instance.</li>
 	<li>We can throw a command line in there to override the container’s defined one.</li>
</ul>
The unit of compute the container runs on is the <em>container group</em>.  It is possible to run <a href="https://docs.microsoft.com/en-us/azure/container-instances/container-instances-multi-container-group">more than one container within a container group</a>.  At the time of this writing (early April 2018), this can only be done using ARM Template.  That is, it isn’t supported though the CLI or PowerShell.

As <a href="https://docs.microsoft.com/en-us/azure/container-instances/container-instances-orchestrator-relationship">explicitly mentioned in the documentation</a>, ACI isn’t meant to replace orchestrators.  There exists a connector to Kubernetes, <a href="https://github.com/virtual-kubelet/virtual-kubelet/tree/master/providers/azure">Virtual Kubelet</a>.  At the time of this writing (early April 2018), the connector is experimental.
<h2>ACI Limitations</h2>
ACI has some limitations at the time of this writing (early April 2018).

ACI isn’t available in every Azure Regions yet.  See <a title="https://azure.microsoft.com/en-us/global-infrastructure/services/" href="https://azure.microsoft.com/en-us/global-infrastructure/services/">https://azure.microsoft.com/en-us/global-infrastructure/services/</a> for up to date availability.  At the time of this writing, it is only available in 5 regions.  This number will likely grow sooner rather than later.

ACI isn’t able to join an Azure Virtual Network (VNET).  This means ACI can’t expose private IPs to other VNET members.  It can expose a public IP as we have seen.  It also means it cannot reach private IPs.

<a href="https://azure.microsoft.com/en-us/support/legal/sla/container-instances/v1_0/">ACI availability SLA</a> is similar to a <a href="https://vincentlauzon.com/2016/11/23/single-vm-sla/">Single VM SLA</a>, i.e. %99.9.  It isn’t possible at the moment to increase that SLA via load balancing or other mean.
<h2>Getting Started</h2>
In our a <a href="https://vincentlauzon.com/2018/04/24/getting-started-with-docker-in-azure/">recent article</a>, we did follow <a href="https://docs.docker.com/get-started/">Getting started in 6 steps</a> from Docker’s site.

Here we are going to do something similar but with ACI.  We changed the Flask web app slightly.  We removed Redis dependency which created an error on purpose.

The code to create the container image can is <a href="https://github.com/vplauzon/containers/tree/master/get-started-no-redis">here on GitHub</a>.  The image available on <a href="https://hub.docker.com/r/vplauzon/get-started/tags/">Docker Hub</a>, so we won’t have to build it.

First, we’ll use <a href="https://docs.microsoft.com/en-us/cli/azure/container">Azure Command Line Interface</a> (CLI).  This works well from a Linux shell but also on both Windows and Mac.

We’ll then do the same thing using <a href="https://docs.microsoft.com/en-us/powershell/module/azurerm.containerinstance/?view=azurermps-5.6.0#container_instances">PowerShell</a>.
<h2>Create a container instance</h2>
Let’s create a container instance.

<strong>We need to make sure to have the latest version of the CLI</strong>.

Here we define a few shell variables that should be unique to our environment:
<table border="3">
<thead>
<tr style="background:green;color:white;">
<th>Variable</th>
<th>Description</th>
<th>Comment</th>
</tr>
</thead>
<tbody>
<tr>
<td>rg</td>
<td>Resource Group</td>
<td>The resource group should be created beforehand</td>
</tr>
<tr>
<td>cn</td>
<td>Container Name</td>
<td>Name of the Azure resource itself, not the container image name</td>
</tr>
<tr>
<td>dns</td>
<td>DNS label</td>
<td>Should be unique within the region as it will map to the domain name &lt;dns&gt;.&lt;region&gt;.azurecontainer.io</td>
</tr>
</tbody>
</table>

[code language="bash"]

rg=&quot;aci&quot;

cn=&quot;mycontainer&quot;

dns=&quot;flaskdemo&quot;

az container create --resource-group $rg --location eastus --name $cn --image vplauzon/get-started:part2-no-redis --dns-name-label $dns --ports 80

[/code]

This should only take a few seconds to deploy.  We can then test it by going to <a href="http://&lt;dns&gt;.&lt;region&gt;.azurecontainer.io">http://&lt;dns&gt;.&lt;region&gt;.azurecontainer.io</a>

<a href="http://vincentlauzon.files.wordpress.com/2018/04/image.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="http://vincentlauzon.files.wordpress.com/2018/04/image_thumb.png" alt="image" border="0" /></a>

This is conform to the <a href="https://github.com/vplauzon/containers/blob/master/get-started-no-redis/app.py">Flask (Python code) of the app</a>.

ACI is very fast to deploy.  It can hence be used for bursting or quick jobs.
<h2>Looking at logs</h2>
ACI runs in an inaccessible host.  So we can’t use the <em>docker</em> command line to get to familiar features.

A few of those are available through Azure CLI.  For instance, if we want to look at the logs of the container:

[code language="bash"]

az container logs --resource-group $rg --name $cn

[/code]

As shown in the <a href="https://docs.microsoft.com/en-us/azure/container-instances/container-instances-quickstart#attach-output-streams">online documentations</a>, we can also attach our standard output to the log streams.
<h2>Access the container shell</h2>
As shown in the <a href="https://docs.microsoft.com/en-us/azure/container-instances/container-instances-exec">online documentation</a>, we can also access the shell of the container:

[code language="bash"]

az container exec --resource-group $rg --name $cn --exec-command &quot;/bin/bash&quot;

[/code]

We can then navigate through the directory structure.  This shows the container is identical to one running locally.  Of course this is how containers should behave.
<h2>PowerShell</h2>
Let’s quickly run the same sample in PowerShell.

<strong>We have to make sure we have the latest version of Azure PowerShell SDK</strong>.  We need to install the module <strong>AzureRm.ContainerInstance</strong>.

For creation we have:

[code language="PowerShell"]

$rg=&quot;aci&quot;
$cn=&quot;mycontainer&quot;
$dns=&quot;flaskdemo&quot;

New-AzureRmContainerGroup -ResourceGroupName $rg -Location eastus -Name $cn -Image vplauzon/get-started:part2-no-redis -Port 80

[/code]

Again, only a few seconds are necessary to see the result.

We can take a look at the logs:

[code language="PowerShell"]

Get-AzureRmContainerInstanceLog -ResourceGroupName $rg -Name $cn -ContainerGroupName $cn

[/code]

At the time of this writing (early April 2018), it is impossible to execute a command into a container via PowerShell.  Therefore, it is impossible to access the shell of a container.
<h2>Summary</h2>
We’ve seen how we can easily deploy a container using Azure Container Instance <strong>in seconds</strong>.

We could then look at the logs of the container and even connect a shell to the container.

We can do that in Azure CLI, Azure PowerShell and ARM Template (although we didn’t use it here).

ACI has a few limitations today.  Mainly that it can only be exposed over public internet.  This means that today ACI is more tailored for public facing services or jobs.  Those limitations will likely go away in the near future.

The speed at which those containers can be spun up and down makes ACI an excellent tool in an agile context.