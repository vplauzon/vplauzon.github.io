---
title:  URL Routing with Azure Application Gateway
date:  2017-05-08 21:58:40 +00:00
permalink:  "/2017/05/08/url-routing-with-azure-application-gateway/"
categories:
- Solution
tags:
- Networking
- Web
---
<strong>Update (13-06-2017):  The POC of this article is available on <a href="https://github.com/vplauzon/app-gateway/tree/master/vmss-path-routing-windows">GitHub here</a>.</strong>

<img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" src="https://static.pexels.com/photos/66100/pexels-photo-66100.jpeg" width="240" height="208" align="right" border="0" />I have a scenario perfect for a Layer-7 Load Balancer / Reverse Proxy:
<ul>
 	<li>Multiple web server clusters to be routed under one URL hierarchy (one domain name)</li>
 	<li>Redirect HTTP traffic to the same URL on HTTPS</li>
 	<li>Have reverse proxy performing SSL termination (or SSL offloading), i.e. accepting HTTPS but routing to underlying servers using HTTP</li>
</ul>
On paper, <a href="https://azure.microsoft.com/en-us/documentation/articles/application-gateway-introduction/" target="_blank" rel="noopener noreferrer">Azure Application Gateway</a> can do all of those.  Let’s fine out in practice.
<h2>Azure Application Gateway Concepts</h2>
<img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" src="https://static.pexels.com/photos/48898/wood-cube-abc-cube-letters-48898.jpeg" width="240" height="160" align="right" border="0" />From <a href="https://docs.microsoft.com/en-us/azure/application-gateway/application-gateway-create-gateway-arm" target="_blank" rel="noopener">the documentation</a>:

<em>Application Gateway is a layer-7 load balancer.  It provides failover, performance-routing HTTP requests between different servers, whether they are on the cloud or on-premises. Application Gateway provides many Application Delivery Controller (ADC) features including HTTP load balancing, cookie-based session affinity, Secure Sockets Layer (SSL) offload, custom health probes, support for multi-site, and many others.</em>

Before we get into the meat of it, there are a <a href="https://docs.microsoft.com/en-us/azure/application-gateway/application-gateway-create-gateway-arm" target="_blank" rel="noopener">bunch of concepts</a> Application Gateway uses and we need to understand:
<ul>
 	<li><strong>Back-end server pool:</strong> The list of IP addresses of the back-end servers. The IP addresses listed should either belong to the virtual network subnet or should be a public IP/VIP.</li>
 	<li><strong>Back-end server pool settings:</strong> Every pool has settings like port, protocol, and cookie-based affinity. These settings are tied to a pool and are applied to all servers within the pool.</li>
 	<li><strong>Front-end port:</strong> This port is the public port that is opened on the application gateway. Traffic hits this port, and then gets redirected to one of the back-end servers.</li>
 	<li><strong>Listener:</strong> The listener has a front-end port, a protocol (Http or Https, these values are case-sensitive), and the SSL certificate name (if configuring SSL offload).</li>
 	<li><strong>Rule:</strong> The rule binds the listener, the back-end server pool and defines which back-end server pool the traffic should be directed to when it hits a particular listener.</li>
</ul>
On top of those, we should probably add <strong>probes</strong> that are associated to a back-end pool to determine its health.
<h2>Proof of Concept</h2>
As a proof of concept, we’re going to implement the following:

<a href="assets/2017/5/url-routing-with-azure-application-gateway/image.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2017/5/url-routing-with-azure-application-gateway/image_thumb.png" alt="image" border="0" /></a>

We use Windows Virtual Machine Scale Sets (VMSS) for back-end servers.

In a production setup, we would go for exposing the port 443 on the web, but for a POC, this should be sufficient.

As of this writing, there are no feature to allow automatic redirection from port 80 to port 443.  Usually, for public web site, we want to redirect users to HTTPS.  This could be achieve by having one of the VM scale set implementing the redirection and routing HTTP traffic to it.
<h2>ARM Template</h2>
We’ve published the ARM template <a href="https://github.com/vplauzon/app-gateway/tree/master/vmss-path-routing-windows" target="_blank" rel="noopener">on GitHub</a>.

First, let’s look at the <a href="http://armviz.io/#/?load=https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fapp-gateway%2Fmaster%2Fvmss-path-routing-windows%2Fazuredeploy.json" target="_blank" rel="noopener">visualization</a>.

<a href="assets/2017/5/url-routing-with-azure-application-gateway/image1.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2017/5/url-routing-with-azure-application-gateway/image_thumb1.png" alt="image" border="0" /></a>

The template is split within 4 files:
<ul>
 	<li><em>azuredeploy.json</em>, the master ARM template.  It simply references the others and passes parameters around.</li>
 	<li><em>network.json</em>, responsible for the virtual network and Network Security Groups</li>
 	<li><em>app-gateway.json</em>, responsible for the Azure Application Gateway and its public IP</li>
 	<li><em>vmss.json</em>, responsible for VM scale set, a public IP and a public load balancer ; this template is invoked 3 times with 3 different set of parameters to create the 3 VM scale sets</li>
</ul>
We’ve configured the VMSS to have public IPs.  It is quite typical to want to connect directly to a back-end servers while testing.  We also optionally open the VMSS to RDP traffic ; this is controlled by the ARM template’s parameter <em>RDP Rule</em> (<em>Allow</em>, <em>Deny</em>).
<h2>Template parameters</h2>
Here are the following ARM template parameters.
<table>
<thead>
<tr style="background:lightgreen;">
<th>Parameter</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>Public DNS Prefix</td>
<td>The DNS suffix for each VMSS public IP.
They are then suffixed by ‘a’, ‘b’ &amp; ‘c’.</td>
</tr>
<tr>
<td>RDP Rule</td>
<td>Switch allowing or not allowing RDP network traffic to reach VMSS from public IPs.</td>
</tr>
<tr>
<td>Cookie Based Affinity</td>
<td>Switch enabling / disabling cookie based affinity on the Application Gateway.</td>
</tr>
<tr>
<td>VNET Name</td>
<td>Name of the Virtual Network (default to <em>VNet</em>).</td>
</tr>
<tr>
<td>VNET IP Prefix</td>
<td>Prefix of the IP range for the VNET (default to <em>10.0.0</em>).</td>
</tr>
<tr>
<td>VM Admin Name</td>
<td>Local user account for administrator on all the VMs in all VMSS (default to <em>vmssadmin</em>).</td>
</tr>
<tr>
<td>VM Admin Password</td>
<td>Password for the VM Admin (same for all VMs of all VMSS).</td>
</tr>
<tr>
<td>Instance Count</td>
<td>Number of VMs in each VMSS.</td>
</tr>
<tr>
<td>VM Size</td>
<td>SKU of the VMs for the VMSS (default to <em>Standard DS2-v2</em>).</td>
</tr>
</tbody>
</table>
<h2>Routing</h2>
An important characteristic of URL-based routing is that requests are routed to back-end servers without alteration.

This is important.  It means that /a/ on the Application Gateway is mapped to /a/ on the Web Server.  It isn’t mapped to /, which seems more intuitive as that would seem like the root of the ‘a’ web servers.  This is because URL-base routing can be more general than just defining suffix.
<h2>Summary</h2>
This proof of concept gives a fully functional example of Azure Application Gateway using URL-based routing.

This is a great showcase for Application Gateway as it can then reverse proxy all traffic while keeping user affinity using cookies.