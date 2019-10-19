---
title: Multiple Service Endpoints to multiple services
date: 2019-04-18 06:30:32 -04:00
permalink: /2019/04/18/multiple-service-endpoints-to-multiple-services/
categories:
- Solution
tags:
- Networking
- Security
---
<img style="float:left;padding-right:20px;" title="From pixabay.com" src="/assets/2019/4/multiple-service-endpoints-to-multiple-services/beautiful-cute-face-1524105-e1555511392815.jpg" />

Use case:  I have a central thingy that needs to talk to a service protected by a <a href="https://vincentlauzon.com/2017/10/02/vnet-service-endpoints-for-azure-sql-storage/">service endpoints</a> (e.g. storage account, Azure SQL DB, Azure Maria DB, etc.).  That service is also accessible to another compute in other Virtual Networks.

Is that possible?

Just to make it a little more concrete, let's give an example.  Let's say I have a CI/CD agent (e.g. <a href="https://docs.microsoft.com/en-us/azure/devops/pipelines/agents/agents?view=azure-devops">Azure DevOps agent</a>) in a VNET.  My CI/CD needs to access a database protected by Service Endpoint (e.g. to deploy some DB scripts).  That database also needs to be accessed by a web server in another VNET.

In this article, I'll demonstrate this to be possible and easy.  We'll deploy something demonstrating that.

As usual, the <a href="https://github.com/vplauzon/networking/tree/master/multiple-endpoints">code is in GitHub</a>.

<h2>Mental Model</h2>

The reason the scenario above might seem hard or impossible is a misconception of Service Endpoints in Azure.

We often have the following model for a service endpoint:

<img src="/assets/2019/4/multiple-service-endpoints-to-multiple-services/mentalmodel.png" alt="Mental Model (wrong)" />
(Typical mental model:  <strong>Wrong!</strong>)

We think a Service Endpoint puts an Azure PaaS service <strong>inside</strong> a VNET.  <strong>It doesn't</strong>.

The PaaS service still is outside our VNET.  <a href="https://docs.microsoft.com/en-us/azure/virtual-network/virtual-network-service-endpoints-overview">Service Endpoints</a> simply add a networking filter on the service to accept inbound connection from certain subnets.

So, it's not about injecting the PaaS inside a subnet.  It's about allowing only some subnets access to the PaaS.

<h2>Demo</h2>

Let's demonstrate the scenario above with a simplified solution:

<img src="/assets/2019/4/multiple-service-endpoints-to-multiple-services/demo-solution.png" alt="demo solution" />

Here we have three (3) storage accounts accessed by three (3) applications in three (3) separate VNETs.  We also have an <a href="https://docs.microsoft.com/en-ca/azure/container-instances/container-instances-overview">Azure Container Instance</a> (ACI), representing our CI/CD, sitting in another VNET.  That ACI is granted access to two (2) of the storage account but not the third one.

We see here the storage accounts aren't in any VNET.  Two of them are accessed by compute in different VNETs.

As a note, we use ACI because it's easy &amp; quick to deploy.  Also, ACI <em>does get injected inside a Virtual Network</em>.  Therefore, the Service Endpoints rule will apply to it.

<h2>Deployment</h2>

Let's deploy that solution using our ARM template:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fnetworking%2Fmaster%2Fmultiple-endpoints%2Fdeploy.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy button" /></a>

It is important to deploy the solution in one of the following regions:  EastUS2EUAP, CentralUSEUAP, WestUS, WestCentralUS, NorthEurope, WestEurope, EastUS or AustraliaEast.  This is because those are the only regions where ACI integration with VNETs are currently (as of mid April 2019) available.

The only parameter is <strong>storage-prefix</strong>.  This is used to prefix the three (3) storage account.  This needs to be unique throughout Azure and be compatible with a storage account name, i.e. lowercase and no special characters.

<h2>Looking at deployment</h2>

Let's look at the deployment.  We should have the following resources corresponding to the diagram:

<img src="/assets/2019/4/multiple-service-endpoints-to-multiple-services/resources.png" alt="Resources" />

The three VNETs <em>app-a</em>, <em>app-b</em> &amp; <em>app-c</em> do represent the "normal workloads" (although they not have actual compute in them) while <em>central-vnet</em> represents our CI/CD or whatever secondary workload.  <em>central-aci</em> is deployed within <em>central-vnet</em>, hence will be able to give us the perspective of a workload running in that VNET.

There are three storage accounts.

Now if we look at all the subnet, we'll find they have enabled service endpoints for <em>Microsoft.Storage</em>:

<img src="/assets/2019/4/multiple-service-endpoints-to-multiple-services/ms-storage.png" alt="ms-storage" />

If we look at the storage accounts now, we see the subnets they allow to pass.  For instance, for the 'a' storage account:

<img src="/assets/2019/4/multiple-service-endpoints-to-multiple-services/app-a.png" alt="Storage Account service endpoint" />

We have a similar picture for the 'b' storage account.  For the 'c' account though, only the <em>app-c</em> VNET has an allowed subnet:

<img src="/assets/2019/4/multiple-service-endpoints-to-multiple-services/app-c.png" alt="app-c" />

This means that the <em>central-vnet</em>'s subnet should have access to 'a' &amp; 'b' but not 'c'.

<h2>Testing access</h2>

We could easily test the access.  Sitting in <em>central-vnet</em> we could simply <em>curl</em> to the storage REST API.

Actually, this is exactly what we did by deploying three containers in ACI curling to the three different storage account.

We can look at the logs of the containers and see that <em>witness-a</em> received an empty list of blobs (we are listing the blobs in a blob container):

<img src="/assets/2019/4/multiple-service-endpoints-to-multiple-services/curl-a.png" alt="Curl storage A" />

<em>witness-b</em> is similar while <em>witness-c</em> receives an authorization error:

<img src="/assets/2019/4/multiple-service-endpoints-to-multiple-services/curl-c.png" alt="Curl storage C" />

So we proved that we can access a multi-tenant PaaS resource (e.g. Storage account, Azure SQL DB, etc., <a href="https://docs.microsoft.com/en-us/azure/virtual-network/virtual-network-service-endpoints-overview">here for an up-to-date list</a>) from different VNETs using different service endpoints.

Technically, we didn't show that a compute sitting in the *app-** would have access to their respective storage.  We leave that as an exercise to the reader!

<h2>Security</h2>

What is the RBAC model for Security endpoints?

This is well explained in the <a href="https://docs.microsoft.com/en-us/azure/virtual-network/virtual-network-service-endpoints-overview#provisioning">online documentation</a>.

<h2>Summary</h2>

We did dive a little bit into Azure Service Endpoints.

We saw that it isn't the same thing as injecting a PaaS service in a subnet.  Instead, it is about authorizing compute in a given subnet to access a PaaS service.

Given that, multiple compute from different VNETs can access the same PaaS service.

Those VNETs do not need to be peered together.  In the demo we did, the VNETs were even made of identical IP ranges (hence couldn't be peered).