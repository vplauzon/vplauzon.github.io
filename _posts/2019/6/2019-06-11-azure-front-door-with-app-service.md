---
title:  Azure Front Door with App Service
date:  2019-06-11 10:30:40 +00:00
permalink:  "/2019/06/11/azure-front-door-with-app-service/"
categories:
- Solution
tags:
- Networking
- Security
- Web
---
<img style="float:right;padding-left:20px;" title="From pexels.com" src="https://vincentlauzon.files.wordpress.com/2019/06/ancient-antique-architecture-277630-e1559945053466.jpg" />

<a href="https://docs.microsoft.com/en-us/azure/frontdoor/front-door-overview">Azure Front Door service</a> was recently released.

Azure Front Door is an interesting service combining the capabilities of:

<ul>
<li>Reverse Proxy (SSL Termination, URL based routing, URL rewrite &amp; session affinity)</li>
<li>Web Application Firewall (WAF)</li>
<li>Accelerated Global routing</li>
<li>Global Load Balancing between geo-distributed backend</li>
<li>Some bits of Content Delivery Network (CDN, in the form of caching requests)</li>
</ul>

The pricing model also is also interesting as it is based on consumption (per outbound data transfer) as opposed to compute unit as for appliances.

Azure Front Door is meant to route public traffic to public endpoints.  <strong>It doesn't integrate with Azure Virtual Networks</strong>.

In this article, I wanted to show how to connect it to a Web App deployed on an Azure App Service.  For simplicity's sake, we do not activate the WAF in here.

As usual, <a href="https://github.com/vplauzon/app-service/tree/master/front-door">code is in GitHub</a>.

<h2>Deployment</h2>

Here is the solution we are going to ground the conversation around:

<img src="https://vincentlauzon.files.wordpress.com/2019/06/appservice.png" alt="Deployment" />

This is a typical reverse proxy use case.

We can easily deploy the solution:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fapp-service%2Fmaster%2Ffront-door%2Fdeploy.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy button" /></a>

The <a href="https://github.com/vplauzon/app-service/blob/master/front-door/deploy.json">ARM template</a> has 4 parameters:

<table>
<thead>
<tr>
  <th>Parameter</th>
  <th align="center">Mandatory</th>
  <th>Description</th>
</tr>
</thead>
<tbody>
<tr>
  <td>frontDoorHostPrefix</td>
  <td align="center">X</td>
  <td>The DNS prefix for the default front door domain name (in the diagram, that is the 'X' variable)</td>
</tr>
<tr>
  <td>webAppName</td>
  <td align="center">X</td>
  <td>The name of the web app, also DNS prefix for its default domain name (in the diagram, the 'Y' variable)</td>
</tr>
<tr>
  <td>webAppSKU</td>
  <td align="center"></td>
  <td>Sku of the web app (actually App Service):  <em>Free</em>, <em>Shared</em>, <em>Basic</em> or <em>Standard</em>.  Default to <em>Standard</em> because life is too short.</td>
</tr>
<tr>
  <td>workerSize</td>
  <td align="center"></td>
  <td>Size of the App Service:  0 (small), 1(medium), 2(large).  Default to 0 because we won't deploy a real web app.</td>
</tr>
</tbody>
</table>

As usual, to author the ARM template, we looked at the <a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.network/2019-04-01/frontdoors">online documentation</a>, reverse engineered a deployment made from the portal, checked out some <a href="https://azure.microsoft.com/en-ca/resources/templates/?term=front+door&amp;pageNumber=1">Azure Quickstart Templates</a> and use our imagination.

<h1>Blocking App Service</h1>

A typical concern in a reverse proxy scenario is to block traffic coming directly to the back-end service, in this case the Web App.

It is possible to do that.  In <a href="https://docs.microsoft.com/en-us/azure/frontdoor/front-door-faq#how-do-i-lock-down-the-access-to-my-backend-to-only-azure-front-door-service">the FAQ</a>, we can find the CIDR for Front Door service:

<ul>
<li>IPv4 - 147.243.0.0/16</li>
<li>IPv6 - 2a01:111:2050::/44</li>
</ul>

So we can easily configure this in the Web App firewall.

Now it is important to note that this IP range is for all Front Door instances.  Azure Front Door is a multi-tenant global service.  So, we do not get an IP range for our instance of Front Door.

This means the rule we put in place discriminate against traffic coming for elsewhere than Azure Front Door (e.g. a browser) but not against traffic coming from another Azure Front Door instance.

If that is a concern, we would need to layer another access control.  For instance, we could enforce authentication on the Web App (not done in this deployment).

<h1>Testing the deployment</h1>

Let's test the deployment.

We can see there are three resources deployed by the ARM template:

<img src="https://vincentlauzon.files.wordpress.com/2019/06/resourcegroup.png" alt="Resource Group" />

(Yes, we are in the UK today)

The App Service Plan is akin to a server farm while the App Service is akin to an application running on that farm.

We can see the Front Door service isn't in a specific region but is a global service (with a [%99.99 SLA](https://azure.microsoft.com/en-us/support/legal/sla/Front Door/v1_0/)).

Let's open the Front Door resource.

<img src="https://vincentlauzon.files.wordpress.com/2019/06/frontdoor-1.png" alt="Front Door" />

In the top-right corner we find a URL to the main front-end.  If we browse on that URL we get the following page:

<img src="https://vincentlauzon.files.wordpress.com/2019/06/frontdoor-page.png" alt="Front Door page" />

This is the App Service default page, since we didn't deploy any code for the Web App.

It might take a few seconds for the service to be up and running.

Let's now open the App Service resource.

<img src="https://vincentlauzon.files.wordpress.com/2019/06/appservice-1.png" alt="App Service" />

We also have the URL of the web app in the top right corner.  If we browse to that page though, we are denied access:

<img src="https://vincentlauzon.files.wordpress.com/2019/06/appservice-page.png" alt="App Service page" />

This is because, as mentioned in the previous section, we blocked requests not coming from Azure Front Door.

<h2>HTTPs</h2>

Something that isn't possible to do today is to easily redirect HTTP traffic to HTTPS.

What we did though is to enforce that the traffic between Front Door and App Service is always in HTTPS, regardless of the incoming request on Azure Front Door.

<h2>Summary</h2>

We looked at a simple deployment of Azure Front Door in front of Azure App Service.

This deployment allows us to front an App Service with Azure Front Door.  That gives us the following possibilities:

<ul>
<li>Accelerate traffic</li>
<li>Implement WAF (not done in this article)</li>
<li>Add App Service deployments in multiple regions</li>
<li>Cache elements at Azure Front Door level, akin to a CDN</li>
</ul>

In future articles, we'll dive deeper into the inner works of Azure Front Door and consider more complex scenarios.