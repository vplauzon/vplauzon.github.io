---
title: Azure Container Registry - Getting Started
date: 2018-05-01 03:30:04 -07:00
permalink: /2018/05/01/azure-container-registry-getting-started/
categories:
- Solution
tags:
- Containers
---
<a href="http://vincentlauzon.files.wordpress.com/2018/04/blur-blurry-book-159510.jpg"><img style="border:0 currentcolor;margin-right:0;margin-left:0;float:right;display:inline;background-image:none;" title="blur-blurry-book-159510" src="http://vincentlauzon.files.wordpress.com/2018/04/blur-blurry-book-159510_thumb.jpg" alt="blur-blurry-book-159510" width="320" height="180" align="right" border="0" /></a>When we looked at an <a href="https://vincentlauzon.com/2018/04/04/overview-of-docker-containers-in-azure/">overview of Container Services in Azure</a>, we took a look at <a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-intro">Azure Container Registry</a> (ACR).

A Docker Registry holds Docker images in repositories.  Any agent can build &amp; push those images.  Nodes running Docker containers can then pull those images.

The main advantages of using Azure Docker Registry (ACR) are
<ul>
 	<li>Network proximity to workloads running Docker Containers (same Azure region)</li>
 	<li>Integration with Azure Active Directory (AAD)</li>
 	<li>Well defined <a href="https://azure.microsoft.com/en-us/support/legal/sla/container-registry/v1_1/">SLA</a></li>
 	<li>Geo-distribution (opt-in)</li>
 	<li>Deployment integration</li>
</ul>
In the last point, we refer to the ability of deploying ACR with an entire Azure environment.
<h2>Docker &amp; Azure CLI integration</h2>
<a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-azure-cli">Online documentation gives a good quick start</a> which we won’t repeat here.  A point we would like to emphasise though is the integration between Azure CLI and Docker CLI.

In the quick start, we do <a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-azure-cli#create-a-container-registry">create a registry</a> using Azure CLI.  We then <a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-azure-cli#log-in-to-acr">log into the registry</a>, still using Azure CLI.  That command, i.e. <em>az acr login</em>, actually integrates with the Docker CLI.  This is why we are able to use Docker CLI to push images to the registry afterwards.

It is therefore required to have the Docker CLI installed for this command, and later ones, to work.  For this reason we cannot do this quick start using Linux subsystem on Windows as we can’t install Docker on it.

For Windows users, the options are
<ul>
 	<li><a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-powershell">Run Azure PowerShell SDK with Docker for Windows</a></li>
 	<li><a href="https://vincentlauzon.com/2018/04/11/linux-custom-script-docker-sandbox/">Run a Linux VM in Azure with both Docker &amp; Azure CLI</a></li>
</ul>
<h2>Identity Integration</h2>
<a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-authentication">Online documentation</a> also cover integration with Azure AD.

Basically, ACR uses Azure AD as its identity backend.  The only exception is the <a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-authentication#admin-account">Admin account</a>, which is disabled by default.

This is why we can login to the ACR with our own account as described in the last section.

We recommend <a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-authentication#service-principal">using a Service Principal</a> for <em>headless </em>agents interacting with ACR.  For instance:
<ul>
 	<li>Visual Studio Team Services (VSTS) building and pushing images</li>
 	<li>AKS pulling container images</li>
</ul>
Access Control works as any other Azure resources, i.e. <a href="https://docs.microsoft.com/en-us/azure/active-directory/role-based-access-control-configure">using RBAC</a>.  A User or Service Principal can be given different roles on ACR.  Those roles define which actions User or Service Principal can perform.  For instance, <em>Reader</em> can only pull images.  Details on the different roles &amp; associated actions are available in the <a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-authentication#service-principal">online documentation</a>.
<h2>Web Hooks</h2>
ACR support <a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-webhook">web hooks</a>.  We can react to different actions happening in ACR.  As of this writing (mid April 2018), push &amp; pull actions are supported.

Using web hooks, we react to an event in ACR using:
<ul>
 	<li>Azure Logic Apps</li>
 	<li>Azure Function</li>
 	<li>Azure Automation</li>
 	<li>Anything able to implement a web hook</li>
</ul>
<h2>Summary</h2>
We just covered a lap around ACR.

The online documentation contains <a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-best-practices">Best Practices for ACR</a> which is a good read.  The <a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-best-practices#repository-namespaces">repository namespaces section</a> is especially interesting as a governance inspiration.