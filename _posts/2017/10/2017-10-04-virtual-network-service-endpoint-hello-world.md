---
title:  Virtual Network Service Endpoint - Hello World
date:  10/04/2017 16:00:14
permalink:  "/2017/10/04/virtual-network-service-endpoint-hello-world/"
categories:
- Solution
tags:
- Networking
- Security
- Virtual Machines
---
In <a href="http://vincentlauzon.com/2017/10/02/vnet-service-endpoints-for-azure-sql-storage/">our last post</a> we discussed the new feature Virtual Network Service Endpoint.

In this post we’re going to show how to use that feature.

We’re going to use it on a <strong>storage account</strong>.

We won’t go through the micro steps of setting up each services but we’ll focus on the Service Endpoint configuration.
<h2>Resource Group</h2>
As usual for demo / feature trial, let’s create a Resource Group for this so we can wipe it out at the end.
<h2>Storage Account</h2>
Let’s create a storage account in the resource group we’ve just created.

Let’s create a blob container named test.  Let’s configure the blob container to have a public access level of <em>Blob</em> (i.e. anonymous read access for blobs only).

Let’s create a text file with the proverbial <em>Hello World</em> sentence so we can recognize it.  Let’s name that file <em>A.txt</em> in it and copy it in the blob container.

We should be able to access the file via its public URL.  For instance, given a storage account named <em>vplsto</em> we can find the URL by browsing the blobs.

<a href="assets/2017/10/virtual-network-service-endpoint-hello-world/image9.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/10/virtual-network-service-endpoint-hello-world/image_thumb9.png" alt="image" border="0" /></a>

Then selecting the container we can select the blob.

<a href="assets/2017/10/virtual-network-service-endpoint-hello-world/image10.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/10/virtual-network-service-endpoint-hello-world/image_thumb10.png" alt="image" border="0" /></a>

And there we should have access to the blob URL.<a href="assets/2017/10/virtual-network-service-endpoint-hello-world/image11.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/10/virtual-network-service-endpoint-hello-world/image_thumb11.png" alt="image" border="0" /></a>

We should be able to open it in a browser.

<a href="assets/2017/10/virtual-network-service-endpoint-hello-world/image12.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/10/virtual-network-service-endpoint-hello-world/image_thumb12.png" alt="image" border="0" /></a>
<h2>Virtual Machine</h2>
Let’s create a Virtual Machine within the same resource group.

Here we’re going to use a Linux distribution in order to use the CURL command line later on but obviously something quite similar could be done with a Windows Server.

Once the deployment is done, let’s select the Virtual Network.

<a href="assets/2017/10/virtual-network-service-endpoint-hello-world/image13.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/10/virtual-network-service-endpoint-hello-world/image_thumb13.png" alt="image" border="0" /></a>

Let’s select the Subnet tab and then the subnet where we deployed the VM (in our case the subnet is names <em>VMs</em>).

<a href="assets/2017/10/virtual-network-service-endpoint-hello-world/image14.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/10/virtual-network-service-endpoint-hello-world/image_thumb14.png" alt="image" border="0" /></a>

At the bottom of the page, let’s select the <em>Services</em> drop down under <em>Service Endpoints</em> section.  Let’s pick <em>Microsoft.Storage</em>.

<a href="assets/2017/10/virtual-network-service-endpoint-hello-world/image15.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/10/virtual-network-service-endpoint-hello-world/image_thumb15.png" alt="image" border="0" /></a>

Let’s hit save.
<h2></h2>
<h2>Separation of concerns</h2>
This is the Virtual Network configuration part we had to do.  Next we’ll need to tell the storage account to accept connections only from our subnet.

By design the configuration is split between two areas:  the Virtual Network and the PaaS Service (Storage in our case).

The aim of this design is to have potentially two individuals with two different permission sets configuring the services.  The network admin configures the Virtual Network while the DBA would configure the database, the storage admin would configure the storage account, etc.  .
<h2>Configuring Storage Account</h2>
In the Storage Account, main screen, let’s select <em>Firewalls and virtual networks</em>.

<a href="assets/2017/10/virtual-network-service-endpoint-hello-world/image16.png"><img style="margin:0;border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/10/virtual-network-service-endpoint-hello-world/image_thumb16.png" alt="image" border="0" /></a>

From there, let’s select the <em>Selected Networks</em> radio button.

Then let’s click on <em>Add existing virtual network</em> and select the VNET &amp; subnet where the VM was deployed.

Let’s leave the <em>Exceptions</em> without changing it.

<a href="assets/2017/10/virtual-network-service-endpoint-hello-world/image17.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/10/virtual-network-service-endpoint-hello-world/image_thumb17.png" alt="image" border="0" /></a>

Let’s hit save.

If we refresh our web page pointing to the blob we should have an <em>Authorization</em> error page.

<a href="assets/2017/10/virtual-network-service-endpoint-hello-world/image18.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/10/virtual-network-service-endpoint-hello-world/image_thumb18.png" alt="image" border="0" /></a>

This is because our desktop computer isn’t on the VNET we configured.

Let’s SSH to the VM and try the following command line:

<em>curl https://vplsto.blob.core.windows.net/test/A.txt</em>

(replacing the URL by the blob URL we captured previously).

This should return us our <em>Hello World</em>.  This is because the VM is within the subnet we configured within the storage account.
<h2>Summary</h2>
We’ve done a simple implementation of Azure Virtual Network Service Endpoints.

It is worth nothing that filtering is done at the subnet level.  It is therefore important to design our Virtual Network with the right level of granularity for the subnets.